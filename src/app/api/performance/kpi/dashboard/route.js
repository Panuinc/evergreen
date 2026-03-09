import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") || new Date().getFullYear();
  const employeeId = searchParams.get("employeeId");

  try {

    let query = supabase
      .from("perfKpiAssignment")
      .select("*")
      .eq("isActive", true)
      .eq("perfKpiAssignmentYear", parseInt(year));

    if (employeeId) {
      query = query.eq("perfKpiAssignmentEmployeeId", employeeId);
    }

    const { data: assignments, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });

    if (!assignments || assignments.length === 0) {
      return Response.json([]);
    }


    const defIds = [...new Set(assignments.map((a) => a.perfKpiAssignmentDefinitionId))];
    const { data: definitions } = await supabase
      .from("perfKpiDefinition")
      .select("*")
      .in("perfKpiDefinitionId", defIds);
    const defMap = {};
    for (const d of (definitions || [])) defMap[d.perfKpiDefinitionId] = d;


    const empIds = [...new Set(assignments.map((a) => a.perfKpiAssignmentEmployeeId))];
    const { data: emps } = await supabase
      .from("hrEmployee")
      .select("hrEmployeeId, hrEmployeeFirstName, hrEmployeeLastName, hrEmployeeDepartment")
      .in("hrEmployeeId", empIds);
    const empMap = {};
    for (const e of (emps || [])) empMap[e.hrEmployeeId] = e;


    const assignmentIds = assignments.map((a) => a.perfKpiAssignmentId);
    const { data: allRecords } = await supabase
      .from("perfKpiRecord")
      .select("*")
      .in("perfKpiRecordAssignmentId", assignmentIds)
      .order("perfKpiRecordPeriodLabel", { ascending: true });
    const recordsMap = {};
    for (const r of (allRecords || [])) {
      if (!recordsMap[r.perfKpiRecordAssignmentId]) recordsMap[r.perfKpiRecordAssignmentId] = [];
      recordsMap[r.perfKpiRecordAssignmentId].push(r);
    }


    const dashboard = assignments.map((a) => {
      const records = recordsMap[a.perfKpiAssignmentId] || [];
      const latestRecord = records.length > 0 ? records[records.length - 1] : null;
      const latestValue = latestRecord ? latestRecord.perfKpiRecordActualValue : null;

      const def = defMap[a.perfKpiAssignmentDefinitionId] || {};
      let status = "none";
      if (latestValue != null) {
        if (def.perfKpiDefinitionHigherIsBetter !== false) {
          if (latestValue >= a.perfKpiAssignmentTargetValue) status = "success";
          else if (def.perfKpiDefinitionWarningThreshold != null && latestValue >= def.perfKpiDefinitionWarningThreshold) status = "warning";
          else status = "danger";
        } else {
          if (latestValue <= a.perfKpiAssignmentTargetValue) status = "success";
          else if (def.perfKpiDefinitionWarningThreshold != null && latestValue <= def.perfKpiDefinitionWarningThreshold) status = "warning";
          else status = "danger";
        }
      }

      return {
        assignmentId: a.perfKpiAssignmentId,
        definitionId: a.perfKpiAssignmentDefinitionId,
        employeeId: a.perfKpiAssignmentEmployeeId,
        employee: empMap[a.perfKpiAssignmentEmployeeId] || null,
        definition: def,
        targetValue: a.perfKpiAssignmentTargetValue,
        weight: a.perfKpiAssignmentWeight,
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
