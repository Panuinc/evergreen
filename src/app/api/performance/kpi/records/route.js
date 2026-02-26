import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");

  if (!assignmentId) {
    return Response.json({ error: "กรุณาระบุ assignmentId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("perfKpiRecord")
    .select("*")
    .eq("perfKpiRecordAssignmentId", assignmentId)
    .order("perfKpiRecordPeriodLabel", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();
  const { assignmentId, periodLabel, actualValue, note } = body;

  if (!assignmentId || !periodLabel || actualValue == null) {
    return Response.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("perfKpiRecord")
    .upsert([{
      perfKpiRecordAssignmentId: assignmentId,
      perfKpiRecordPeriodLabel: periodLabel,
      perfKpiRecordActualValue: parseFloat(actualValue),
      perfKpiRecordNote: note || null,
      perfKpiRecordRecordedBy: session.user.id,
    }], { onConflict: "perfKpiRecordAssignmentId,perfKpiRecordPeriodLabel" })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
