import { withAuth } from "@/app/api/_lib/auth";

const VALID_STATUSES = ["open", "pending", "closed"];

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { id } = await params;

  let query = supabase
    .from("omConversation")
    .select("*, omContact(*)")
    .eq("omConversationId", id);
  if (!isSuperAdmin) query = query.eq("isActive", true);
  const { data, error } = await query.single();

  if (error) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(data);
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateData = {};

  if (body.omConversationStatus !== undefined) {
    if (!VALID_STATUSES.includes(body.omConversationStatus)) {
      return Response.json({ error: "Invalid status" }, { status: 400 });
    }
    updateData.omConversationStatus = body.omConversationStatus;
  }
  if (body.omConversationAssignedTo !== undefined) {
    if (body.omConversationAssignedTo !== null && typeof body.omConversationAssignedTo !== "string") {
      return Response.json({ error: "Invalid assignedTo" }, { status: 400 });
    }
    updateData.omConversationAssignedTo = body.omConversationAssignedTo;
  }
  if (body.omConversationUnreadCount !== undefined) {
    if (typeof body.omConversationUnreadCount !== "number" || body.omConversationUnreadCount < 0) {
      return Response.json({ error: "Invalid unreadCount" }, { status: 400 });
    }
    updateData.omConversationUnreadCount = body.omConversationUnreadCount;
  }
  if (body.omConversationAiAutoReply !== undefined) {
    if (typeof body.omConversationAiAutoReply !== "boolean") {
      return Response.json({ error: "Invalid aiAutoReply" }, { status: 400 });
    }
    updateData.omConversationAiAutoReply = body.omConversationAiAutoReply;
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("omConversation")
    .update(updateData)
    .eq("omConversationId", id)
    .select("*, omContact(*)")
    .single();

  if (error) return Response.json({ error: "Update failed" }, { status: 400 });
  return Response.json(data);
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  await supabase.from("omMessage").update({ isActive: false }).eq("omMessageConversationId", id);

  const { error } = await supabase
    .from("omConversation")
    .update({ isActive: false })
    .eq("omConversationId", id);

  if (error) return Response.json({ error: "Delete failed" }, { status: 400 });
  return Response.json({ success: true });
}
