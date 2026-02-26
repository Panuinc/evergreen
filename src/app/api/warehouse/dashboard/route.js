import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const userId = session.user.id;

  const [sessionsRes, transfersRes, recentRes] = await Promise.all([
    supabase
      .from("whScanSession")
      .select("id, tag_count")
      .eq("user_id", userId),
    supabase
      .from("whTransfer")
      .select("id, status")
      .eq("user_id", userId),
    supabase
      .from("whScanSession")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(5),
  ]);

  if (sessionsRes.error || transfersRes.error || recentRes.error) {
    return Response.json(
      { error: "โหลดข้อมูลแดชบอร์ดล้มเหลว" },
      { status: 500 }
    );
  }

  const sessions = sessionsRes.data || [];
  const transfers = transfersRes.data || [];

  const total_sessions = sessions.length;
  const total_tags = sessions.reduce(
    (sum, s) => sum + (parseInt(s.tag_count) || 0),
    0
  );
  const total_transfers = transfers.length;
  const pending_transfers = transfers.filter(
    (t) => t.status === "pending"
  ).length;

  return Response.json({
    total_sessions,
    total_tags,
    total_transfers,
    pending_transfers,
    recent_sessions: recentRes.data || [],
  });
}
