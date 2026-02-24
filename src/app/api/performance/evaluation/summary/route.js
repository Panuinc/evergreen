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

  // Company-wide average for a period
  if (companyAverage === "true" && period) {
    const { data, error } = await supabase
      .from("evaluations")
      .select("categoryAverages")
      .eq("period", period);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data.length) return Response.json({ categoryAverages: null, count: 0 });

    const avgCategories = {};
    for (const cat of EVALUATION_CATEGORIES) {
      const sum = data.reduce(
        (acc, ev) => acc + (ev.categoryAverages?.[cat.key] || 0),
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

  // All employees summary for a period (admin)
  if (period) {
    const { data, error } = await supabase
      .from("evaluations")
      .select(
        "evaluateeEmployeeId, categoryAverages, overallScore, grade, evaluatorId, evaluateeEmployee:employees!evaluateeEmployeeId(employeeId, employeeFirstName, employeeLastName, employeeDepartment, employeeDivision)",
      )
      .eq("period", period);

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Group by evaluatee and average
    const grouped = {};
    for (const ev of data) {
      const eid = ev.evaluateeEmployeeId;
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
          (acc, ev) => acc + (ev.categoryAverages?.[cat.key] || 0),
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

  // Single employee's all periods
  if (employeeId) {
    const { data, error } = await supabase
      .from("evaluations")
      .select("period, year, quarter, categoryAverages, overallScore, grade")
      .eq("evaluateeEmployeeId", employeeId)
      .order("year", { ascending: true })
      .order("quarter", { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Group by period
    const grouped = {};
    for (const ev of data) {
      if (!grouped[ev.period]) {
        grouped[ev.period] = { period: ev.period, year: ev.year, quarter: ev.quarter, evaluations: [] };
      }
      grouped[ev.period].evaluations.push(ev);
    }

    const result = Object.values(grouped).map((group) => {
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

    return Response.json(result);
  }

  return Response.json({ error: "Missing query parameters" }, { status: 400 });
}
