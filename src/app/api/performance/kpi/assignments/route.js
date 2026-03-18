import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

async function enrichAssignments(supabase, assignments) {
  if (!assignments || assignments.length === 0) return [];

  const defIds = [...new Set(assignments.map((a) => a.perfKpiAssignmentDefinitionId))];
  const empIds = [...new Set(assignments.map((a) => a.perfKpiAssignmentEmployeeId))];

  const [{ data: definitions }, { data: emps }] = await Promise.all([
    supabase.from("perfKpiDefinition").select("*").in("perfKpiDefinitionId", defIds),
    supabase.from("hrEmployee").select("hrEmployeeId, hrEmployeeFirstName, hrEmployeeLastName, hrEmployeeDepartment").in("hrEmployeeId", empIds),
  ]);

  const defMap = {};
  for (const d of (definitions || [])) defMap[d.perfKpiDefinitionId] = d;
  const empMap = {};
  for (const e of (emps || [])) empMap[e.hrEmployeeId] = e;

  return assignments.map((a) => ({
    ...a,
    definition: defMap[a.perfKpiAssignmentDefinitionId] || null,
    employee: empMap[a.perfKpiAssignmentEmployeeId] || null,
  }));
}

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session, isSuperAdmin } = auth;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const employeeId = searchParams.get("employeeId");
  const definitionId = searchParams.get("definitionId");
  const myAssignments = searchParams.get("myAssignments");

  let query = supabase
    .from("perfKpiAssignment")
    .select("*");
  if (!isSuperAdmin) query = query.eq("isActive", true);
  query = query.order("perfKpiAssignmentCreatedAt", { ascending: false });

  if (year) query = query.eq("perfKpiAssignmentYear", parseInt(year));
  if (definitionId) query = query.eq("perfKpiAssignmentDefinitionId", definitionId);

  if (myAssignments === "true") {
    const { data: currentEmployee } = await supabase
      .from("hrEmployee")
      .select("hrEmployeeId")
      .eq("hrEmployeeUserId", session.user.id)
      .maybeSingle();

    if (!currentEmployee) return Response.json([]);
    query = query.eq("perfKpiAssignmentEmployeeId", currentEmployee.hrEmployeeId);
  } else if (employeeId) {
    query = query.eq("perfKpiAssignmentEmployeeId", employeeId);
  }

  const { data, error } = await fetchAll(query);
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
    .from("perfKpiAssignment")
    .insert([{
      perfKpiAssignmentDefinitionId: definitionId,
      perfKpiAssignmentEmployeeId: employeeId,
      perfKpiAssignmentYear: parseInt(year),
      perfKpiAssignmentTargetValue: parseFloat(targetValue),
      perfKpiAssignmentWeight: weight ? parseFloat(weight) : 1,
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
