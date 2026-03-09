import { withAuth } from "@/app/api/_lib/auth";
import {
  EVALUATION_CATEGORIES,
  computeOverallScore,
  computeGrade,
} from "@/lib/performance/evaluationCriteria";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const companyAverage = searchParams.get("companyAverage");
  const employeeId = searchParams.get("employeeId");


  if (companyAverage === "true" && period) {
    const { data, error } = await supabase
      .from("perfEvaluation")
      .select("perfEvaluationCategoryAverages")
      .eq("perfEvaluationPeriod", period);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data.length) return Response.json({ categoryAverages: null, count: 0 });

    const avgCategories = {};
    for (const cat of EVALUATION_CATEGORIES) {
      const sum = data.reduce(
        (acc, ev) => acc + (ev.perfEvaluationCategoryAverages?.[cat.key] || 0),
        0,
      );
      avgCategories[cat.key] = parseFloat((sum / data.length).toFixed(2));
    }

    const overallScore = computeOverallScore(avgCategories);

    return Response.json({
      categoryAverages: avgCategories,
      overallScore: parseFloat(overallScore.toFixed(2)),
      grade: computeGrade(overallScore),
      count: data.length,
    });
  }


  if (period) {
    const { data, error } = await supabase
      .from("perfEvaluation")
      .select(
        "perfEvaluationEvaluateeEmployeeId, perfEvaluationCategoryAverages, perfEvaluationOverallScore, perfEvaluationGrade, perfEvaluationEvaluatorId, evaluateeEmployee:hrEmployee!perfEvaluationEvaluateeEmployeeId(hrEmployeeId, hrEmployeeFirstName, hrEmployeeLastName, hrEmployeeDepartment, hrEmployeeDivision)",
      )
      .eq("perfEvaluationPeriod", period);

    if (error) return Response.json({ error: error.message }, { status: 500 });


    const grouped = {};
    for (const ev of data) {
      const eid = ev.perfEvaluationEvaluateeEmployeeId;
      if (!grouped[eid]) {
        grouped[eid] = {
          employee: ev.evaluateeEmployee,
          evaluations: [],
        };
      }
      grouped[eid].evaluations.push(ev);
    }

    const summary = Object.values(grouped).map((group) => {
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
        employee: group.employee,
        categoryAverages: avgCategories,
        overallScore: parseFloat(overallScore.toFixed(2)),
        grade: computeGrade(overallScore),
        evaluatorCount: count,
      };
    });

    summary.sort((a, b) => b.overallScore - a.overallScore);
    return Response.json(summary);
  }


  if (employeeId) {
    const { data, error } = await supabase
      .from("perfEvaluation")
      .select("perfEvaluationPeriod, perfEvaluationYear, perfEvaluationQuarter, perfEvaluationCategoryAverages, perfEvaluationOverallScore, perfEvaluationGrade")
      .eq("perfEvaluationEvaluateeEmployeeId", employeeId)
      .order("perfEvaluationYear", { ascending: true })
      .order("perfEvaluationQuarter", { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });


    const grouped = {};
    for (const ev of data) {
      if (!grouped[ev.perfEvaluationPeriod]) {
        grouped[ev.perfEvaluationPeriod] = { period: ev.perfEvaluationPeriod, year: ev.perfEvaluationYear, quarter: ev.perfEvaluationQuarter, evaluations: [] };
      }
      grouped[ev.perfEvaluationPeriod].evaluations.push(ev);
    }

    const result = Object.values(grouped).map((group) => {
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

    return Response.json(result);
  }

  return Response.json({ error: "Missing query parameters" }, { status: 400 });
}
