import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") || new Date().getFullYear();
  const employeeId = searchParams.get("employeeId");

  try {
    // Get assignments
    let query = supabase
      .from("kpi_assignments")
      .select("*")
      .eq("year", parseInt(year));

    if (employeeId) {
      query = query.eq("employeeId", employeeId);
    }

    const { data: assignments, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    if (!assignments || assignments.length === 0) {
      return Response.json([]);
    }

    // Fetch definitions separately
    const defIds = [...new Set(assignments.map((a) => a.definitionId))];
    const { data: definitions } = await supabase
      .from("kpi_definitions")
      .select("*")
      .in("id", defIds);
    const defMap = {};
    for (const d of (definitions || [])) defMap[d.id] = d;

    // Fetch employees separately
    const empIds = [...new Set(assignments.map((a) => a.employeeId))];
    const { data: emps } = await supabase
      .from("employees")
      .select("employeeId, employeeFirstName, employeeLastName, employeeDepartment")
      .in("employeeId", empIds);
    const empMap = {};
    for (const e of (emps || [])) empMap[e.employeeId] = e;

    // Fetch records separately
    const assignmentIds = assignments.map((a) => a.id);
    const { data: allRecords } = await supabase
      .from("kpi_records")
      .select("*")
      .in("assignmentId", assignmentIds)
      .order("periodLabel", { ascending: true });
    const recordsMap = {};
    for (const r of (allRecords || [])) {
      if (!recordsMap[r.assignmentId]) recordsMap[r.assignmentId] = [];
      recordsMap[r.assignmentId].push(r);
    }

    // Process dashboard data
    const dashboard = assignments.map((a) => {
      const records = recordsMap[a.id] || [];
      const latestRecord = records.length > 0 ? records[records.length - 1] : null;
      const latestValue = latestRecord ? latestRecord.actualValue : null;

      const def = defMap[a.definitionId] || {};
      let status = "none";
      if (latestValue != null) {
        if (def.higherIsBetter !== false) {
          if (latestValue >= a.targetValue) status = "success";
          else if (def.warningThreshold != null && latestValue >= def.warningThreshold) status = "warning";
          else status = "danger";
        } else {
          if (latestValue <= a.targetValue) status = "success";
          else if (def.warningThreshold != null && latestValue <= def.warningThreshold) status = "warning";
          else status = "danger";
        }
      }

      return {
        assignmentId: a.id,
        definitionId: a.definitionId,
        employeeId: a.employeeId,
        employee: empMap[a.employeeId] || null,
        definition: def,
        targetValue: a.targetValue,
        weight: a.weight,
        latestValue,
        status,
        records,
      };
    });

    return Response.json(dashboard);
  } catch (err) {
    console.error("KPI Dashboard error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
