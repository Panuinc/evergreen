import { withAuth } from "@/app/api/_lib/auth";
import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";
import {
  EVALUATION_CATEGORIES,
  computeOverallScore,
  computeGrade,
} from "@/lib/performance/evaluationCriteria";
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


  const { data: cached } = await sb
    .from("perfEvaluationFeedback")
    .select("*")
    .eq("perfEvaluationFeedbackEmployeeId", employeeId)
    .eq("perfEvaluationFeedbackPeriod", period)
    .maybeSingle();

  if (!cached) {
    return Response.json({ feedback: null, isStale: false });
  }


  const currentScores = await getAggregatedScores(sb, employeeId, period);
  let isStale = false;
  if (currentScores) {
    isStale = JSON.stringify(cached.perfEvaluationFeedbackCategoryAverages) !== JSON.stringify(currentScores.categoryAverages);
  }

  return Response.json({ feedback: cached.perfEvaluationFeedbackFeedback, isStale });
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


  const scores = await getAggregatedScores(sb, employeeId, period);
  if (!scores) {
    return Response.json({ error: "ไม่มีผลประเมินสำหรับรอบนี้" }, { status: 400 });
  }


  const companyAverages = await getCompanyAverage(sb, period);


  const feedback = await generateEvaluationFeedback({
    categoryAverages: scores.categoryAverages,
    overallScore: scores.overallScore,
    grade: scores.grade,
    evaluatorCount: scores.evaluatorCount,
    companyAverages,
    period,
  });


  const { error: upsertError } = await sb
    .from("perfEvaluationFeedback")
    .upsert(
      {
        perfEvaluationFeedbackEmployeeId: employeeId,
        perfEvaluationFeedbackPeriod: period,
        perfEvaluationFeedbackCategoryAverages: scores.categoryAverages,
        perfEvaluationFeedbackOverallScore: scores.overallScore,
        perfEvaluationFeedbackGrade: scores.grade,
        perfEvaluationFeedbackCompanyAverages: companyAverages,
        perfEvaluationFeedbackEvaluatorCount: scores.evaluatorCount,
        perfEvaluationFeedbackFeedback: feedback,
        perfEvaluationFeedbackGeneratedBy: session.user.id,
        perfEvaluationFeedbackCreatedAt: new Date().toISOString(),
      },
      { onConflict: "perfEvaluationFeedbackEmployeeId,perfEvaluationFeedbackPeriod" },
    );

  if (upsertError) {
    console.error("Feedback upsert error:", upsertError);
    return Response.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  return Response.json({ feedback });
}

async function getAggregatedScores(sb, employeeId, period) {
  const { data, error } = await sb
    .from("perfEvaluation")
    .select("perfEvaluationCategoryAverages, perfEvaluationOverallScore, perfEvaluationGrade")
    .eq("perfEvaluationEvaluateeEmployeeId", employeeId)
    .eq("perfEvaluationPeriod", period);

  if (error || !data?.length) return null;

  const count = data.length;
  const avgCategories = {};

  for (const cat of EVALUATION_CATEGORIES) {
    const sum = data.reduce(
      (acc, ev) => acc + (ev.perfEvaluationCategoryAverages?.[cat.key] || 0),
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
    .from("perfEvaluation")
    .select("perfEvaluationCategoryAverages")
    .eq("perfEvaluationPeriod", period);

  if (error || !data?.length) return null;

  const avgCategories = {};
  for (const cat of EVALUATION_CATEGORIES) {
    const sum = data.reduce(
      (acc, ev) => acc + (ev.perfEvaluationCategoryAverages?.[cat.key] || 0),
      0,
    );
    avgCategories[cat.key] = parseFloat((sum / data.length).toFixed(2));
  }

  return avgCategories;
}
