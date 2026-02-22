import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { searchParams } = new URL(request.url);
  const visibility = searchParams.get("visibility");
  const year = searchParams.get("year");
  const quarter = searchParams.get("quarter");
  const employeeId = searchParams.get("employeeId");

  // Get current user's employee
  const { data: currentEmployee } = await supabase
    .from("employees")
    .select("employeeId, employeeDepartment")
    .eq("employeeUserId", session.user.id)
    .maybeSingle();

  let query = supabase
    .from("okr_objectives")
    .select("*")
    .order("createdAt", { ascending: false });

  if (year) query = query.eq("year", parseInt(year));
  if (quarter) query = query.eq("quarter", parseInt(quarter));

  if (employeeId) {
    query = query.eq("employeeId", employeeId);
  } else if (visibility === "company") {
    query = query.eq("visibility", "company");
  } else if (visibility === "team") {
    query = query.in("visibility", ["team", "company"]);
  } else {
    // Default: my own objectives
    if (currentEmployee) {
      query = query.eq("employeeId", currentEmployee.employeeId);
    } else {
      return Response.json([]);
    }
  }

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) return Response.json([]);

  // Fetch key results separately
  const objIds = data.map((o) => o.id);
  const { data: allKrs } = await supabase
    .from("okr_key_results")
    .select("*")
    .in("objectiveId", objIds)
    .order("sortOrder", { ascending: true });

  const krMap = {};
  for (const kr of (allKrs || [])) {
    if (!krMap[kr.objectiveId]) krMap[kr.objectiveId] = [];
    krMap[kr.objectiveId].push(kr);
  }

  // Fetch employees separately
  const empIds = [...new Set(data.map((o) => o.employeeId))];
  const { data: emps } = await supabase
    .from("employees")
    .select("employeeId, employeeFirstName, employeeLastName, employeeDepartment")
    .in("employeeId", empIds);

  const empMap = {};
  for (const e of (emps || [])) empMap[e.employeeId] = e;

  const sorted = data.map((obj) => ({
    ...obj,
    keyResults: krMap[obj.id] || [],
    employee: empMap[obj.employeeId] || null,
  }));

  return Response.json(sorted);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();
  const { title, description, year, quarter, visibility, parentObjectiveId, keyResults } = body;

  if (!title || !year || !quarter) {
    return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  // Get current employee
  const { data: currentEmployee } = await supabase
    .from("employees")
    .select("employeeId")
    .eq("employeeUserId", session.user.id)
    .maybeSingle();

  if (!currentEmployee) {
    return Response.json({ error: "ไม่พบข้อมูลพนักงาน" }, { status: 400 });
  }

  const period = `Q${quarter}-${year}`;

  const { data: objective, error } = await supabase
    .from("okr_objectives")
    .insert([{
      employeeId: currentEmployee.employeeId,
      title,
      description: description || null,
      year: parseInt(year),
      quarter: parseInt(quarter),
      period,
      visibility: visibility || "team",
      parentObjectiveId: parentObjectiveId || null,
      createdBy: session.user.id,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  // Create key results if provided
  if (keyResults && keyResults.length > 0) {
    const krRows = keyResults.map((kr, i) => ({
      objectiveId: objective.id,
      title: kr.title,
      metricType: kr.metricType || "number",
      startValue: kr.startValue || 0,
      targetValue: kr.targetValue,
      currentValue: kr.currentValue || 0,
      unit: kr.unit || null,
      weight: kr.weight || 1,
      sortOrder: i,
    }));

    const { error: krError } = await supabase.from("okr_key_results").insert(krRows);
    if (krError) return Response.json({ error: krError.message }, { status: 400 });
  }

  // Re-fetch with key results
  const { data: krs } = await supabase
    .from("okr_key_results")
    .select("*")
    .eq("objectiveId", objective.id)
    .order("sortOrder", { ascending: true });

  return Response.json({ ...objective, keyResults: krs || [] }, { status: 201 });
}
