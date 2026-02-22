import { withAuth } from "@/app/api/_lib/auth";

async function enrichNominations(supabase, nominations) {
  if (!nominations || nominations.length === 0) return [];

  const empIds = [...new Set([
    ...nominations.map((n) => n.revieweeEmployeeId),
    ...nominations.map((n) => n.reviewerEmployeeId),
  ])];

  const { data: emps } = await supabase
    .from("employees")
    .select("employeeId, employeeFirstName, employeeLastName, employeeDepartment")
    .in("employeeId", empIds);

  const empMap = {};
  for (const e of (emps || [])) empMap[e.employeeId] = e;

  return nominations.map((n) => ({
    ...n,
    reviewee: empMap[n.revieweeEmployeeId] || null,
    reviewer: empMap[n.reviewerEmployeeId] || null,
  }));
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");

  if (!cycleId) {
    return Response.json({ error: "กรุณาระบุ cycleId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feedback_360_nominations")
    .select("*")
    .eq("cycleId", cycleId)
    .order("createdAt", { ascending: false });

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
    .from("feedback_360_nominations")
    .insert([{ cycleId, revieweeEmployeeId, reviewerEmployeeId, relationshipType }])
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
    .from("feedback_360_nominations")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
