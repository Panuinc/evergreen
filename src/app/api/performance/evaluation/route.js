import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";
import {
  EVALUATION_CATEGORIES,
  computeCategoryAverages,
  computeOverallScore,
  computeGrade,
} from "@/lib/performance/evaluationCriteria";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { searchParams } = new URL(request.url);
  const myResults = searchParams.get("myResults");
  const period = searchParams.get("period");
  const evaluateeId = searchParams.get("evaluateeId");


  const { data: currentEmployee } = await supabase
    .from("hrEmployee")
    .select("hrEmployeeId")
    .eq("hrEmployeeUserId", session.user.id)
    .maybeSingle();

  if (myResults === "true" && currentEmployee) {

    let query = supabase
      .from("perfEvaluation")
      .select("perfEvaluationPeriod, perfEvaluationYear, perfEvaluationQuarter, perfEvaluationCategoryAverages, perfEvaluationOverallScore, perfEvaluationGrade, perfEvaluationCreatedAt")
      .eq("perfEvaluationEvaluateeEmployeeId", currentEmployee.hrEmployeeId);

    if (period) query = query.eq("perfEvaluationPeriod", period);

    const { data, error } = await fetchAll(query.order("perfEvaluationCreatedAt", { ascending: true }));
    if (error) return Response.json({ error: error.message }, { status: 500 });


    const aggregated = aggregateByPeriod(data);
    return Response.json(aggregated);
  }

  if (evaluateeId) {
    let query = supabase
      .from("perfEvaluation")
      .select("perfEvaluationPeriod, perfEvaluationYear, perfEvaluationQuarter, perfEvaluationCategoryAverages, perfEvaluationOverallScore, perfEvaluationGrade, perfEvaluationCreatedAt")
      .eq("perfEvaluationEvaluateeEmployeeId", evaluateeId);

    if (period) query = query.eq("perfEvaluationPeriod", period);

    const { data, error } = await fetchAll(query.order("perfEvaluationCreatedAt", { ascending: true }));
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const aggregated = aggregateByPeriod(data);
    return Response.json(aggregated);
  }


  let query = supabase
    .from("perfEvaluation")
    .select("*, evaluateeEmployee:hrEmployee!perfEvaluationEvaluateeEmployeeId(hrEmployeeId, hrEmployeeFirstName, hrEmployeeLastName, hrEmployeeDepartment)")
    .eq("perfEvaluationEvaluatorId", session.user.id);

  if (period) query = query.eq("perfEvaluationPeriod", period);

  const { data, error } = await fetchAll(query.order("perfEvaluationCreatedAt", { ascending: false }));
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();
  const { evaluateeEmployeeId, period, year, quarter, scores, comment } = body;


  if (!evaluateeEmployeeId || !period || !year || !quarter || !scores) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }


  const { data: currentEmployee } = await supabase
    .from("hrEmployee")
    .select("hrEmployeeId")
    .eq("hrEmployeeUserId", session.user.id)
    .maybeSingle();

  if (currentEmployee && currentEmployee.hrEmployeeId === evaluateeEmployeeId) {
    return Response.json({ error: "ไม่สามารถประเมินตัวเองได้" }, { status: 400 });
  }


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


  const categoryAverages = computeCategoryAverages(scores);
  const overallScore = computeOverallScore(categoryAverages);
  const grade = computeGrade(overallScore);

  const { data, error } = await supabase
    .from("perfEvaluation")
    .insert([
      {
        perfEvaluationEvaluatorId: session.user.id,
        perfEvaluationEvaluateeEmployeeId: evaluateeEmployeeId,
        perfEvaluationPeriod: period,
        perfEvaluationYear: year,
        perfEvaluationQuarter: quarter,
        perfEvaluationScores: scores,
        perfEvaluationCategoryAverages: categoryAverages,
        perfEvaluationOverallScore: parseFloat(overallScore.toFixed(2)),
        perfEvaluationGrade: grade,
        perfEvaluationComment: comment || null,
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
    if (!grouped[ev.perfEvaluationPeriod]) {
      grouped[ev.perfEvaluationPeriod] = {
        period: ev.perfEvaluationPeriod,
        year: ev.perfEvaluationYear,
        quarter: ev.perfEvaluationQuarter,
        evaluations: [],
      };
    }
    grouped[ev.perfEvaluationPeriod].evaluations.push(ev);
  }

  return Object.values(grouped).map((group) => {
    const count = group.evaluations.length;
    const avgCategories = {};

    for (const cat of EVALUATION_CATEGORIES) {
      const sum = group.evaluations.reduce(
        (acc, ev) => acc + (ev.perfEvaluationCategoryAverages?.[cat.key] || 0),
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
