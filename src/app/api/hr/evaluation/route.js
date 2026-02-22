import { withAuth } from "@/app/api/_lib/auth";
import {
  EVALUATION_CATEGORIES,
  computeCategoryAverages,
  computeOverallScore,
  computeGrade,
} from "@/lib/evaluationCriteria";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { searchParams } = new URL(request.url);
  const myResults = searchParams.get("myResults");
  const period = searchParams.get("period");
  const evaluateeId = searchParams.get("evaluateeId");

  // Get current user's linked employee
  const { data: currentEmployee } = await supabase
    .from("employees")
    .select("employeeId")
    .eq("employeeUserId", session.user.id)
    .maybeSingle();

  if (myResults === "true" && currentEmployee) {
    // Get evaluations where current user is the evaluatee
    let query = supabase
      .from("evaluations")
      .select("period, year, quarter, categoryAverages, overallScore, grade, createdAt")
      .eq("evaluateeEmployeeId", currentEmployee.employeeId);

    if (period) query = query.eq("period", period);

    const { data, error } = await query.order("createdAt", { ascending: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Aggregate: average across all evaluators per period
    const aggregated = aggregateByPeriod(data);
    return Response.json(aggregated);
  }

  if (evaluateeId) {
    let query = supabase
      .from("evaluations")
      .select("period, year, quarter, categoryAverages, overallScore, grade, createdAt")
      .eq("evaluateeEmployeeId", evaluateeId);

    if (period) query = query.eq("period", period);

    const { data, error } = await query.order("createdAt", { ascending: true });
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const aggregated = aggregateByPeriod(data);
    return Response.json(aggregated);
  }

  // Default: return evaluations submitted by current user
  let query = supabase
    .from("evaluations")
    .select("*, evaluateeEmployee:employees!evaluateeEmployeeId(employeeId, employeeFirstName, employeeLastName, employeeDepartment)")
    .eq("evaluatorId", session.user.id);

  if (period) query = query.eq("period", period);

  const { data, error } = await query.order("createdAt", { ascending: false });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();
  const { evaluateeEmployeeId, period, year, quarter, scores, comment } = body;

  // Validate required fields
  if (!evaluateeEmployeeId || !period || !year || !quarter || !scores) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate self-evaluation prevention
  const { data: currentEmployee } = await supabase
    .from("employees")
    .select("employeeId")
    .eq("employeeUserId", session.user.id)
    .maybeSingle();

  if (currentEmployee && currentEmployee.employeeId === evaluateeEmployeeId) {
    return Response.json({ error: "ไม่สามารถประเมินตัวเองได้" }, { status: 400 });
  }

  // Validate all 30 scores present and in range 1-5
  for (const cat of EVALUATION_CATEGORIES) {
    const catScores = scores[cat.key];
    if (!Array.isArray(catScores) || catScores.length !== cat.questions.length) {
      return Response.json(
        { error: `กรุณากรอกคะแนนครบทุกข้อในหมวด ${cat.nameTh}` },
        { status: 400 },
      );
    }
    for (const s of catScores) {
      if (!Number.isInteger(s) || s < 1 || s > 5) {
        return Response.json(
          { error: `คะแนนต้องเป็น 1-5 ในหมวด ${cat.nameTh}` },
          { status: 400 },
        );
      }
    }
  }

  // Compute derived values
  const categoryAverages = computeCategoryAverages(scores);
  const overallScore = computeOverallScore(categoryAverages);
  const grade = computeGrade(overallScore);

  const { data, error } = await supabase
    .from("evaluations")
    .insert([
      {
        evaluatorId: session.user.id,
        evaluateeEmployeeId,
        period,
        year,
        quarter,
        scores,
        categoryAverages,
        overallScore: parseFloat(overallScore.toFixed(2)),
        grade,
        comment: comment || null,
      },
    ])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json(
        { error: "คุณได้ประเมินพนักงานท่านนี้ในรอบนี้แล้ว" },
        { status: 409 },
      );
    }
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data, { status: 201 });
}

function aggregateByPeriod(evaluations) {
  const grouped = {};
  for (const ev of evaluations) {
    if (!grouped[ev.period]) {
      grouped[ev.period] = {
        period: ev.period,
        year: ev.year,
        quarter: ev.quarter,
        evaluations: [],
      };
    }
    grouped[ev.period].evaluations.push(ev);
  }

  return Object.values(grouped).map((group) => {
    const count = group.evaluations.length;
    const avgCategories = {};

    for (const cat of EVALUATION_CATEGORIES) {
      const sum = group.evaluations.reduce(
        (acc, ev) => acc + (ev.categoryAverages?.[cat.key] || 0),
        0,
      );
      avgCategories[cat.key] = parseFloat((sum / count).toFixed(2));
    }

    const overallScore = computeOverallScore(avgCategories);

    return {
      period: group.period,
      year: group.year,
      quarter: group.quarter,
      categoryAverages: avgCategories,
      overallScore: parseFloat(overallScore.toFixed(2)),
      grade: computeGrade(overallScore),
      evaluatorCount: count,
    };
  });
}
