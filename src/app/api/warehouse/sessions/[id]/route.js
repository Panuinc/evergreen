import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { id } = await params;

  const { data, error } = await supabase
    .from("scanSessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { id } = await params;
  const body = await request.json();

  const updates = {};
  if (body.ended_at !== undefined) updates.ended_at = body.ended_at;
  if (body.tag_count !== undefined) updates.tag_count = body.tag_count;
  if (body.total_reads !== undefined) updates.total_reads = body.total_reads;
  if (body.metadata !== undefined) updates.metadata = body.metadata;

  const { data, error } = await supabase
    .from("scanSessions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}
