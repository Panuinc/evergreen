import { withAuth } from "@/app/api/_lib/auth";
import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";
import {
  EVALUATION_CATEGORIES,
  computeOverallScore,
  computeGrade,
} from "@/lib/evaluationCriteria";
import { generateEvaluationFeedback } from "@/lib/agents/evaluationFeedbackAgent";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const period = searchParams.get("period");

  if (!employeeId || !period) {
    return Response.json({ error: "Missing employeeId or period" }, { status: 400 });
  }

  const sb = getServiceSupabase();

  // Get cached feedback
  const { data: cached } = await sb
    .from("evaluation_feedback")
    .select("*")
    .eq("employeeId", employeeId)
    .eq("period", period)
    .maybeSingle();

  if (!cached) {
    return Response.json({ feedback: null, isStale: false });
  }

  // Check staleness: compare cached categoryAverages with current scores
  const currentScores = await getAggregatedScores(sb, employeeId, period);
  let isStale = false;
  if (currentScores) {
    isStale = JSON.stringify(cached.categoryAverages) !== JSON.stringify(currentScores.categoryAverages);
  }

  return Response.json({ feedback: cached.feedback, isStale });
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { session } = auth;

  const body = await request.json();
  const { employeeId, period } = body;

  if (!employeeId || !period) {
    return Response.json({ error: "Missing employeeId or period" }, { status: 400 });
  }

  const sb = getServiceSupabase();

  // Get aggregated evaluation scores for this employee+period
  const scores = await getAggregatedScores(sb, employeeId, period);
  if (!scores) {
    return Response.json({ error: "ไม่มีผลประเมินสำหรับรอบนี้" }, { status: 400 });
  }

  // Get company average for the same period
  const companyAverages = await getCompanyAverage(sb, period);

  // Call AI agent
  const feedback = await generateEvaluationFeedback({
    categoryAverages: scores.categoryAverages,
    overallScore: scores.overallScore,
    grade: scores.grade,
    evaluatorCount: scores.evaluatorCount,
    companyAverages,
    period,
  });

  // Upsert into cache
  const { error: upsertError } = await sb
    .from("evaluation_feedback")
    .upsert(
      {
        employeeId,
        period,
        categoryAverages: scores.categoryAverages,
        overallScore: scores.overallScore,
        grade: scores.grade,
        companyAverages,
        evaluatorCount: scores.evaluatorCount,
        feedback,
        generatedBy: session.user.id,
        createdAt: new Date().toISOString(),
      },
      { onConflict: "employeeId,period" },
    );

  if (upsertError) {
    console.error("Feedback upsert error:", upsertError);
    return Response.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  return Response.json({ feedback });
}

async function getAggregatedScores(sb, employeeId, period) {
  const { data, error } = await sb
    .from("evaluations")
    .select("categoryAverages, overallScore, grade")
    .eq("evaluateeEmployeeId", employeeId)
    .eq("period", period);

  if (error || !data?.length) return null;

  const count = data.length;
  const avgCategories = {};

  for (const cat of EVALUATION_CATEGORIES) {
    const sum = data.reduce(
      (acc, ev) => acc + (ev.categoryAverages?.[cat.key] || 0),
      0,
    );
    avgCategories[cat.key] = parseFloat((sum / count).toFixed(2));
  }

  const overallScore = parseFloat(computeOverallScore(avgCategories).toFixed(2));

  return {
    categoryAverages: avgCategories,
    overallScore,
    grade: computeGrade(overallScore),
    evaluatorCount: count,
  };
}

async function getCompanyAverage(sb, period) {
  const { data, error } = await sb
    .from("evaluations")
    .select("categoryAverages")
    .eq("period", period);

  if (error || !data?.length) return null;

  const avgCategories = {};
  for (const cat of EVALUATION_CATEGORIES) {
    const sum = data.reduce(
      (acc, ev) => acc + (ev.categoryAverages?.[cat.key] || 0),
      0,
    );
    avgCategories[cat.key] = parseFloat((sum / data.length).toFixed(2));
  }

  return avgCategories;
}
