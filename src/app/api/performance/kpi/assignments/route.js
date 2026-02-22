import { withAuth } from "@/app/api/_lib/auth";

async function enrichAssignments(supabase, assignments) {
  if (!assignments || assignments.length === 0) return [];

  const defIds = [...new Set(assignments.map((a) => a.definitionId))];
  const empIds = [...new Set(assignments.map((a) => a.employeeId))];

  const [{ data: definitions }, { data: emps }] = await Promise.all([
    supabase.from("kpi_definitions").select("*").in("id", defIds),
    supabase.from("employees").select("employeeId, employeeFirstName, employeeLastName, employeeDepartment").in("employeeId", empIds),
  ]);

  const defMap = {};
  for (const d of (definitions || [])) defMap[d.id] = d;
  const empMap = {};
  for (const e of (emps || [])) empMap[e.employeeId] = e;

  return assignments.map((a) => ({
    ...a,
    definition: defMap[a.definitionId] || null,
    employee: empMap[a.employeeId] || null,
  }));
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const employeeId = searchParams.get("employeeId");
  const definitionId = searchParams.get("definitionId");
  const myAssignments = searchParams.get("myAssignments");

  let query = supabase
    .from("kpi_assignments")
    .select("*")
    .order("createdAt", { ascending: false });

  if (year) query = query.eq("year", parseInt(year));
  if (definitionId) query = query.eq("definitionId", definitionId);

  if (myAssignments === "true") {
    const { data: currentEmployee } = await supabase
      .from("employees")
      .select("employeeId")
      .eq("employeeUserId", session.user.id)
      .maybeSingle();

    if (!currentEmployee) return Response.json([]);
    query = query.eq("employeeId", currentEmployee.employeeId);
  } else if (employeeId) {
    query = query.eq("employeeId", employeeId);
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const enriched = await enrichAssignments(supabase, data);
  return Response.json(enriched);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { definitionId, employeeId, year, targetValue, weight } = body;

  if (!definitionId || !employeeId || !year || targetValue == null) {
    return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("kpi_assignments")
    .insert([{
      definitionId,
      employeeId,
      year: parseInt(year),
      targetValue: parseFloat(targetValue),
      weight: weight ? parseFloat(weight) : 1,
    }])
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return Response.json({ error: "KPI นี้ถูก assign ให้พนักงานท่านนี้ในปีนี้แล้ว" }, { status: 409 });
    }
    return Response.json({ error: error.message }, { status: 400 });
  }

  const enriched = await enrichAssignments(supabase, [data]);
  return Response.json(enriched[0], { status: 201 });
}
