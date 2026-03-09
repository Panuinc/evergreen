import { withAuth } from "@/app/api/_lib/auth";

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

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();


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


  await supabase.from("omMessage").update({ isActive: false }).eq("omMessageConversationId", id);


  const { error } = await supabase
    .from("omConversation")
    .update({ isActive: false })
    .eq("omConversationId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
