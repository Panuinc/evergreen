import { withAuth } from "@/app/api/_lib/auth";
import { VALID_TRANSITIONS } from "@/lib/performance/feedback360Constants";

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const { id } = await params;

  const body = await request.json();
  const { toStatus } = body;

  // Get current cycle
  const { data: cycle, error: cycleError } = await supabase
    .from("feedback_360_cycles")
    .select("*")
    .eq("id", id)
    .single();

  if (cycleError || !cycle) {
    return Response.json({ error: "ไม่พบรอบประเมิน" }, { status: 404 });
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[cycle.status] || [];
  if (!allowed.includes(toStatus)) {
    return Response.json({
      error: `ไม่สามารถเปลี่ยนสถานะจาก "${cycle.status}" เป็น "${toStatus}" ได้`,
    }, { status: 400 });
  }

  // Validation per transition
  if (toStatus === "nominating") {
    const { count } = await supabase
      .from("feedback_360_competencies")
      .select("*", { count: "exact", head: true })
      .eq("cycleId", id);
    if (!count || count === 0) {
      return Response.json({ error: "กรุณาเพิ่มสมรรถนะก่อนเปิดรับการเสนอชื่อ" }, { status: 400 });
    }
  }

  if (toStatus === "active") {
    const { count } = await supabase
      .from("feedback_360_nominations")
      .select("*", { count: "exact", head: true })
      .eq("cycleId", id);
    if (!count || count === 0) {
      return Response.json({ error: "กรุณาเพิ่มรายชื่อผู้ประเมินก่อนเริ่ม" }, { status: 400 });
    }
  }

  // Update status
  const { data, error } = await supabase
    .from("feedback_360_cycles")
    .update({ status: toStatus, updatedAt: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}
