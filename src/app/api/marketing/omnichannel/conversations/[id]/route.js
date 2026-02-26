import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  const { data, error } = await supabase
    .from("omConversation")
    .select("*, omContact(*)")
    .eq("omConversationId", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();

  // Only allow updating specific fields
  const updateData = {};
  if (body.omConversationStatus !== undefined) updateData.omConversationStatus = body.omConversationStatus;
  if (body.omConversationAssignedTo !== undefined) updateData.omConversationAssignedTo = body.omConversationAssignedTo;
  if (body.omConversationUnreadCount !== undefined) updateData.omConversationUnreadCount = body.omConversationUnreadCount;
  if (body.omConversationAiAutoReply !== undefined) updateData.omConversationAiAutoReply = body.omConversationAiAutoReply;

  const { data, error } = await supabase
    .from("omConversation")
    .update(updateData)
    .eq("omConversationId", id)
    .select("*, omContact(*)")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  // Delete messages first (cascade should handle this, but be explicit)
  await supabase.from("omMessage").delete().eq("omMessageConversationId", id);

  // Delete conversation
  const { error } = await supabase
    .from("omConversation")
    .delete()
    .eq("omConversationId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
