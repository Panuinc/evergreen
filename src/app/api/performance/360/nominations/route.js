import { withAuth } from "@/app/api/_lib/auth";

async function enrichNominations(supabase, nominations) {
  if (!nominations || nominations.length === 0) return [];

  const empIds = [...new Set([
    ...nominations.map((n) => n.perf360NominationRevieweeEmployeeId),
    ...nominations.map((n) => n.perf360NominationReviewerEmployeeId),
  ])];

  const { data: emps } = await supabase
    .from("hrEmployee")
    .select("hrEmployeeId, hrEmployeeFirstName, hrEmployeeLastName, hrEmployeeDepartment")
    .in("hrEmployeeId", empIds);

  const empMap = {};
  for (const e of (emps || [])) empMap[e.hrEmployeeId] = e;

  return nominations.map((n) => ({
    ...n,
    reviewee: empMap[n.perf360NominationRevieweeEmployeeId] || null,
    reviewer: empMap[n.perf360NominationReviewerEmployeeId] || null,
  }));
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");

  if (!cycleId) {
    return Response.json({ error: "กรุณาระบุ cycleId" }, { status: 400 });
  }

  let query = supabase
    .from("perf360Nomination")
    .select("*")
    .eq("perf360NominationCycleId", cycleId);
  if (!isSuperAdmin) query = query.eq("isActive", true);
  const { data, error } = await query.order("perf360NominationCreatedAt", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const enriched = await enrichNominations(supabase, data);
  return Response.json(enriched);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { cycleId, revieweeEmployeeId, reviewerEmployeeId, relationshipType } = body;

  if (!cycleId || !revieweeEmployeeId || !reviewerEmployeeId || !relationshipType) {
    return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("perf360Nomination")
    .insert([{
      perf360NominationCycleId: cycleId,
      perf360NominationRevieweeEmployeeId: revieweeEmployeeId,
      perf360NominationReviewerEmployeeId: reviewerEmployeeId,
      perf360NominationRelationshipType: relationshipType,
    }])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "ผู้ประเมินคนนี้ถูกเพิ่มไว้แล้ว" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 400 });
  }

  const enriched = await enrichNominations(supabase, [data]);
  return Response.json(enriched[0], { status: 201 });
}

export async function DELETE(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "กรุณาระบุ id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("perf360Nomination")
    .update({ isActive: false })
    .eq("perf360NominationId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
