import { withAuth } from "@/app/api/_lib/auth";
import { VALID_TRANSITIONS } from "@/lib/performance/feedback360Constants";

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const { toStatus } = body;


  const { data: cycle, error: cycleError } = await supabase
    .from("perf360Cycle")
    .select("*")
    .eq("perf360CycleId", id)
    .single();

  if (cycleError || !cycle) {
    return Response.json({ error: "ไม่พบรอบประเมิน" }, { status: 404 });
  }


  const allowed = VALID_TRANSITIONS[cycle.perf360CycleStatus] || [];
  if (!allowed.includes(toStatus)) {
    return Response.json({
      error: `ไม่สามารถเปลี่ยนสถานะจาก "${cycle.perf360CycleStatus}" เป็น "${toStatus}" ได้`,
    }, { status: 400 });
  }


  if (toStatus === "nominating") {
    const { count } = await supabase
      .from("perf360Competency")
      .select("*", { count: "exact", head: true })
      .eq("perf360CompetencyCycleId", id);
    if (!count || count === 0) {
      return Response.json({ error: "กรุณาเพิ่มสมรรถนะก่อนเปิดรับการเสนอชื่อ" }, { status: 400 });
    }
  }

  if (toStatus === "active") {
    const { count } = await supabase
      .from("perf360Nomination")
      .select("*", { count: "exact", head: true })
      .eq("perf360NominationCycleId", id);
    if (!count || count === 0) {
      return Response.json({ error: "กรุณาเพิ่มรายชื่อผู้ประเมินก่อนเริ่ม" }, { status: 400 });
    }
  }


  const { data, error } = await supabase
    .from("perf360Cycle")
    .update({ perf360CycleStatus: toStatus, perf360CycleUpdatedAt: new Date().toISOString() })
    .eq("perf360CycleId", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}
