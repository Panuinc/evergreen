import { withAuth } from "@/app/api/_lib/auth";
import { computeCompetencyAverage, computeWeightedOverall } from "@/lib/performance/feedback360Constants";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { searchParams } = new URL(request.url);
  const pending = searchParams.get("pending");

  if (pending === "true") {
    // Get current employee
    const { data: currentEmployee } = await supabase
      .from("employees")
      .select("employeeId")
      .eq("employeeUserId", session.user.id)
      .maybeSingle();

    if (!currentEmployee) return Response.json([]);

    // Get pending nominations
    const { data: nominations, error } = await supabase
      .from("feedback_360_nominations")
      .select("*")
      .eq("reviewerEmployeeId", currentEmployee.employeeId)
      .eq("status", "pending");

    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!nominations || nominations.length === 0) return Response.json([]);

    // Fetch cycles separately
    const cycleIds = [...new Set(nominations.map((n) => n.cycleId))];
    const { data: cycles } = await supabase
      .from("feedback_360_cycles")
      .select("*")
      .in("id", cycleIds);

    const cycleMap = {};
    for (const c of (cycles || [])) cycleMap[c.id] = c;

    // Fetch reviewee employees separately
    const revieweeIds = [...new Set(nominations.map((n) => n.revieweeEmployeeId))];
    const { data: emps } = await supabase
      .from("employees")
      .select("employeeId, employeeFirstName, employeeLastName, employeeDepartment")
      .in("employeeId", revieweeIds);

    const empMap = {};
    for (const e of (emps || [])) empMap[e.employeeId] = e;

    // Enrich and filter for active cycles
    const enriched = nominations
      .map((n) => ({
        ...n,
        cycle: cycleMap[n.cycleId] || null,
        reviewee: empMap[n.revieweeEmployeeId] || null,
      }))
      .filter((n) => n.cycle && n.cycle.status === "active");

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

  // Get nomination
  const { data: nomination, error: nomError } = await supabase
    .from("feedback_360_nominations")
    .select("*")
    .eq("id", nominationId)
    .single();

  if (nomError || !nomination) {
    return Response.json({ error: "ไม่พบรายการประเมิน" }, { status: 404 });
  }

  if (nomination.status === "completed") {
    return Response.json({ error: "รายการนี้ถูกประเมินแล้ว" }, { status: 400 });
  }

  // Get competencies for score validation
  const { data: competencies } = await supabase
    .from("feedback_360_competencies")
    .select("*")
    .eq("cycleId", nomination.cycleId);

  // Compute averages
  const competencyAverages = {};
  for (const comp of (competencies || [])) {
    const compScores = scores[comp.id] || [];
    competencyAverages[comp.id] = parseFloat(computeCompetencyAverage(compScores).toFixed(2));
  }

  const overallScore = parseFloat(computeWeightedOverall(competencyAverages, competencies || []).toFixed(2));

  // Insert response
  const { data: response, error: respError } = await supabase
    .from("feedback_360_responses")
    .insert([{
      nominationId,
      cycleId: nomination.cycleId,
      revieweeEmployeeId: nomination.revieweeEmployeeId,
      reviewerEmployeeId: nomination.reviewerEmployeeId,
      relationshipType: nomination.relationshipType,
      scores,
      competencyAverages,
      overallScore,
      strengthComment: strengthComment || null,
      improvementComment: improvementComment || null,
      comment: comment || null,
    }])
    .select()
    .single();

  if (respError) return Response.json({ error: respError.message }, { status: 400 });

  // Update nomination status
  await supabase
    .from("feedback_360_nominations")
    .update({ status: "completed", completedAt: new Date().toISOString() })
    .eq("id", nominationId);

  return Response.json(response, { status: 201 });
}
