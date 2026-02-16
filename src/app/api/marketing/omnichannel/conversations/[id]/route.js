import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  const { data, error } = await supabase
    .from("omConversations")
    .select("*, omContacts(*)")
    .eq("conversationId", id)
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
  if (body.conversationStatus !== undefined) updateData.conversationStatus = body.conversationStatus;
  if (body.conversationAssignedTo !== undefined) updateData.conversationAssignedTo = body.conversationAssignedTo;
  if (body.conversationUnreadCount !== undefined) updateData.conversationUnreadCount = body.conversationUnreadCount;

  const { data, error } = await supabase
    .from("omConversations")
    .update(updateData)
    .eq("conversationId", id)
    .select("*, omContacts(*)")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}
