import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");
  const employeeId = searchParams.get("employeeId");

  if (!cycleId) {
    return Response.json({ error: "กรุณาระบุ cycleId" }, { status: 400 });
  }


  const { data: cycle } = await supabase
    .from("perf360Cycle")
    .select("*")
    .eq("perf360CycleId", cycleId)
    .single();

  if (!cycle) {
    return Response.json({ error: "ไม่พบรอบประเมิน" }, { status: 404 });
  }


  const { data: competencies } = await supabase
    .from("perf360Competency")
    .select("*")
    .eq("perf360CompetencyCycleId", cycleId)
    .order("perf360CompetencySortOrder");

  if (employeeId) {

    const { data: responses } = await supabase
      .from("perf360Response")
      .select("*")
      .eq("perf360ResponseCycleId", cycleId)
      .eq("perf360ResponseRevieweeEmployeeId", employeeId);

    const result = aggregateResults(responses || [], competencies || [], cycle.perf360CycleAnonymousToReviewee);
    return Response.json({ cycle, competencies, ...result });
  }


  const { data: responses } = await supabase
    .from("perf360Response")
    .select("*")
    .eq("perf360ResponseCycleId", cycleId);


  const revieweeIds = [...new Set((responses || []).map((r) => r.perf360ResponseRevieweeEmployeeId))];
  const empMap = {};
  if (revieweeIds.length > 0) {
    const { data: emps } = await supabase
      .from("hrEmployee")
      .select("hrEmployeeId, hrEmployeeFirstName, hrEmployeeLastName, hrEmployeeDepartment")
      .in("hrEmployeeId", revieweeIds);
    for (const e of (emps || [])) empMap[e.hrEmployeeId] = e;
  }


  const byReviewee = {};
  for (const resp of (responses || [])) {
    const eid = resp.perf360ResponseRevieweeEmployeeId;
    if (!byReviewee[eid]) {
      byReviewee[eid] = {
        employeeId: eid,
        employee: empMap[eid] || null,
        responses: [],
      };
    }
    byReviewee[eid].responses.push(resp);
  }

  const summaries = Object.values(byReviewee).map((item) => {
    const agg = aggregateResults(item.responses, competencies || [], false);
    return {
      employeeId: item.employeeId,
      employee: item.employee,
      ...agg,
    };
  });

  return Response.json({ cycle, competencies, summaries });
}

function aggregateResults(responses, competencies, anonymous) {
  const byType = {};
  for (const resp of responses) {
    const type = resp.perf360ResponseRelationshipType;
    if (!byType[type]) byType[type] = [];
    byType[type].push(resp);
  }

  const typeAverages = {};
  for (const [type, resps] of Object.entries(byType)) {
    const compAverages = {};
    for (const comp of competencies) {
      const values = resps.map((r) => r.perf360ResponseCompetencyAverages?.[comp.perf360CompetencyId] || 0).filter((v) => v > 0);
      compAverages[comp.perf360CompetencyId] = values.length > 0
        ? parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
        : 0;
    }

    const overallValues = resps.map((r) => r.perf360ResponseOverallScore).filter((v) => v > 0);
    const overall = overallValues.length > 0
      ? parseFloat((overallValues.reduce((a, b) => a + b, 0) / overallValues.length).toFixed(2))
      : 0;

    typeAverages[type] = {
      competencyAverages: compAverages,
      overallScore: overall,
      responseCount: resps.length,
    };
  }


  const allOverallScores = responses.map((r) => r.perf360ResponseOverallScore).filter((v) => v > 0);
  const overallScore = allOverallScores.length > 0
    ? parseFloat((allOverallScores.reduce((a, b) => a + b, 0) / allOverallScores.length).toFixed(2))
    : 0;


  const feedback = {};
  for (const [type, resps] of Object.entries(byType)) {
    feedback[type] = {
      strengths: resps.map((r) => r.perf360ResponseStrengthComment).filter(Boolean),
      improvements: resps.map((r) => r.perf360ResponseImprovementComment).filter(Boolean),
      comments: resps.map((r) => r.perf360ResponseComment).filter(Boolean),
    };
  }

  return {
    typeAverages,
    overallScore,
    totalResponses: responses.length,
    feedback,
  };
}
