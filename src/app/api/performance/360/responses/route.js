import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";
import { computeCompetencyAverage, computeWeightedOverall } from "@/lib/performance/feedback360Constants";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { searchParams } = new URL(request.url);
  const pending = searchParams.get("pending");

  if (pending === "true") {

    const { data: currentEmployee } = await supabase
      .from("hrEmployee")
      .select("hrEmployeeId")
      .eq("hrEmployeeUserId", session.user.id)
      .maybeSingle();

    if (!currentEmployee) return Response.json([]);


    const { data: nominations, error } = await fetchAll(supabase
      .from("perf360Nomination")
      .select("*")
      .eq("perf360NominationReviewerEmployeeId", currentEmployee.hrEmployeeId)
      .eq("perf360NominationStatus", "pending"));

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!nominations || nominations.length === 0) return Response.json([]);


    const cycleIds = [...new Set(nominations.map((n) => n.perf360NominationCycleId))];
    const { data: cycles } = await supabase
      .from("perf360Cycle")
      .select("*")
      .in("perf360CycleId", cycleIds);

    const cycleMap = {};
    for (const c of (cycles || [])) cycleMap[c.perf360CycleId] = c;


    const revieweeIds = [...new Set(nominations.map((n) => n.perf360NominationRevieweeEmployeeId))];
    const { data: emps } = await supabase
      .from("hrEmployee")
      .select("hrEmployeeId, hrEmployeeFirstName, hrEmployeeLastName, hrEmployeeDepartment")
      .in("hrEmployeeId", revieweeIds);

    const empMap = {};
    for (const e of (emps || [])) empMap[e.hrEmployeeId] = e;


    const enriched = nominations
      .map((n) => ({
        ...n,
        cycle: cycleMap[n.perf360NominationCycleId] || null,
        reviewee: empMap[n.perf360NominationRevieweeEmployeeId] || null,
      }))
      .filter((n) => n.cycle && n.cycle.perf360CycleStatus === "active");

    return Response.json(enriched);
  }

  return Response.json([]);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { nominationId, scores, strengthComment, improvementComment, comment } = body;

  if (!nominationId || !scores) {
    return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }


  const { data: nomination, error: nomError } = await supabase
    .from("perf360Nomination")
    .select("*")
    .eq("perf360NominationId", nominationId)
    .single();

  if (nomError || !nomination) {
    return Response.json({ error: "ไม่พบรายการประเมิน" }, { status: 404 });
  }

  if (nomination.perf360NominationStatus === "completed") {
    return Response.json({ error: "รายการนี้ถูกประเมินแล้ว" }, { status: 400 });
  }


  const { data: competencies } = await supabase
    .from("perf360Competency")
    .select("*")
    .eq("perf360CompetencyCycleId", nomination.perf360NominationCycleId);


  const competencyAverages = {};
  for (const comp of (competencies || [])) {
    const compScores = scores[comp.perf360CompetencyId] || [];
    competencyAverages[comp.perf360CompetencyId] = parseFloat(computeCompetencyAverage(compScores).toFixed(2));
  }

  const overallScore = parseFloat(computeWeightedOverall(competencyAverages, competencies || []).toFixed(2));


  const { data: response, error: respError } = await supabase
    .from("perf360Response")
    .insert([{
      perf360ResponseNominationId: nominationId,
      perf360ResponseCycleId: nomination.perf360NominationCycleId,
      perf360ResponseRevieweeEmployeeId: nomination.perf360NominationRevieweeEmployeeId,
      perf360ResponseReviewerEmployeeId: nomination.perf360NominationReviewerEmployeeId,
      perf360ResponseRelationshipType: nomination.perf360NominationRelationshipType,
      perf360ResponseScores: scores,
      perf360ResponseCompetencyAverages: competencyAverages,
      perf360ResponseOverallScore: overallScore,
      perf360ResponseStrengthComment: strengthComment || null,
      perf360ResponseImprovementComment: improvementComment || null,
      perf360ResponseComment: comment || null,
    }])
    .select()
    .single();

  if (respError) return Response.json({ error: respError.message }, { status: 400 });


  await supabase
    .from("perf360Nomination")
    .update({ perf360NominationStatus: "completed", perf360NominationCompletedAt: new Date().toISOString() })
    .eq("perf360NominationId", nominationId);

  return Response.json(response, { status: 201 });
}
