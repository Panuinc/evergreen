import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session, isSuperAdmin } = auth;

  const { searchParams } = new URL(request.url);
  const visibility = searchParams.get("visibility");
  const year = searchParams.get("year");
  const quarter = searchParams.get("quarter");
  const employeeId = searchParams.get("employeeId");


  const { data: currentEmployee } = await supabase
    .from("hrEmployee")
    .select("hrEmployeeId, hrEmployeeDepartment")
    .eq("hrEmployeeUserId", session.user.id)
    .maybeSingle();

  let query = supabase
    .from("perfOkrObjective")
    .select("*");
  if (!isSuperAdmin) query = query.eq("isActive", true);
  query = query.order("perfOkrObjectiveCreatedAt", { ascending: false });

  if (year) query = query.eq("perfOkrObjectiveYear", parseInt(year));
  if (quarter) query = query.eq("perfOkrObjectiveQuarter", parseInt(quarter));

  if (employeeId) {
    query = query.eq("perfOkrObjectiveEmployeeId", employeeId);
  } else if (visibility === "company") {
    query = query.eq("perfOkrObjectiveVisibility", "company");
  } else if (visibility === "team") {
    query = query.in("perfOkrObjectiveVisibility", ["team", "company"]);
  } else {

    if (currentEmployee) {
      query = query.eq("perfOkrObjectiveEmployeeId", currentEmployee.hrEmployeeId);
    } else {
      return Response.json([]);
    }
  }

  const { data, error } = await fetchAll(query);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) return Response.json([]);


  const objIds = data.map((o) => o.perfOkrObjectiveId);
  let krQuery = supabase
    .from("perfOkrKeyResult")
    .select("*")
    .in("perfOkrKeyResultObjectiveId", objIds);
  if (!isSuperAdmin) krQuery = krQuery.eq("isActive", true);
  const { data: allKrs } = await fetchAll(krQuery.order("perfOkrKeyResultSortOrder", { ascending: true }));

  const krMap = {};
  for (const kr of (allKrs || [])) {
    if (!krMap[kr.perfOkrKeyResultObjectiveId]) krMap[kr.perfOkrKeyResultObjectiveId] = [];
    krMap[kr.perfOkrKeyResultObjectiveId].push(kr);
  }


  const empIds = [...new Set(data.map((o) => o.perfOkrObjectiveEmployeeId))];
  const { data: emps } = await supabase
    .from("hrEmployee")
    .select("hrEmployeeId, hrEmployeeFirstName, hrEmployeeLastName, hrEmployeeDepartment")
    .in("hrEmployeeId", empIds);

  const empMap = {};
  for (const e of (emps || [])) empMap[e.hrEmployeeId] = e;

  const sorted = data.map((obj) => ({
    ...obj,
    keyResults: krMap[obj.perfOkrObjectiveId] || [],
    employee: empMap[obj.perfOkrObjectiveEmployeeId] || null,
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


  const { data: currentEmployee } = await supabase
    .from("hrEmployee")
    .select("hrEmployeeId")
    .eq("hrEmployeeUserId", session.user.id)
    .maybeSingle();

  if (!currentEmployee) {
    return Response.json({ error: "ไม่พบข้อมูลพนักงาน" }, { status: 400 });
  }

  const period = `Q${quarter}-${year}`;

  const { data: objective, error } = await supabase
    .from("perfOkrObjective")
    .insert([{
      perfOkrObjectiveEmployeeId: currentEmployee.hrEmployeeId,
      perfOkrObjectiveTitle: title,
      perfOkrObjectiveDescription: description || null,
      perfOkrObjectiveYear: parseInt(year),
      perfOkrObjectiveQuarter: parseInt(quarter),
      perfOkrObjectivePeriod: period,
      perfOkrObjectiveVisibility: visibility || "team",
      perfOkrObjectiveParentObjectiveId: parentObjectiveId || null,
      perfOkrObjectiveCreatedBy: session.user.id,
    }])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });


  if (keyResults && keyResults.length > 0) {
    const krRows = keyResults.map((kr, i) => ({
      perfOkrKeyResultObjectiveId: objective.perfOkrObjectiveId,
      perfOkrKeyResultTitle: kr.title,
      perfOkrKeyResultMetricType: kr.metricType || "number",
      perfOkrKeyResultStartValue: kr.startValue || 0,
      perfOkrKeyResultTargetValue: kr.targetValue,
      perfOkrKeyResultCurrentValue: kr.currentValue || 0,
      perfOkrKeyResultUnit: kr.unit || null,
      perfOkrKeyResultWeight: kr.weight || 1,
      perfOkrKeyResultSortOrder: i,
    }));

    const { error: krError } = await supabase.from("perfOkrKeyResult").insert(krRows);
    if (krError) return Response.json({ error: krError.message }, { status: 400 });
  }


  const { data: krs } = await supabase
    .from("perfOkrKeyResult")
    .select("*")
    .eq("perfOkrKeyResultObjectiveId", objective.perfOkrObjectiveId)
    .eq("isActive", true)
    .order("perfOkrKeyResultSortOrder", { ascending: true });

  return Response.json({ ...objective, keyResults: krs || [] }, { status: 201 });
}
