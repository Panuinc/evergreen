import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const conversationId = searchParams.get("conversationId");

  try {
    let query = auth.supabase
      .from("omFollowUp")
      .select("*, omConversation!inner(omConversationId, omContact!inner(omContactDisplayName))")
      .order("omFollowUpScheduledAt", { ascending: true });

    if (status) query = query.eq("omFollowUpStatus", status);
    if (conversationId) query = query.eq("omFollowUpConversationId", conversationId);

    const { data, error } = await query;
    if (error) throw error;
    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to load follow-ups" }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.conversationId) {
    return Response.json({ error: "conversationId is required" }, { status: 400 });
  }
  if (!body.scheduledAt) {
    return Response.json({ error: "scheduledAt is required" }, { status: 400 });
  }

  try {
    const { data, error } = await auth.supabase
      .from("omFollowUp")
      .insert({
        omFollowUpConversationId: body.conversationId,
        omFollowUpScheduledAt: body.scheduledAt,
        omFollowUpMessage: body.message ? String(body.message).slice(0, 2000) : null,
        omFollowUpStatus: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json(data, { status: 201 });
  } catch {
    return Response.json({ error: "Failed to create follow-up" }, { status: 500 });
  }
}
