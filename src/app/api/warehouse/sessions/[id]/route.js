import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { id } = await params;

  const { data, error } = await supabase
    .from("whScanSession")
    .select("*")
    .eq("whScanSessionId", id)
    .eq("whScanSessionUserId", session.user.id)
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
  if (body.ended_at !== undefined) updates.whScanSessionEndedAt = body.ended_at;
  if (body.tag_count !== undefined) updates.whScanSessionTagCount = body.tag_count;
  if (body.total_reads !== undefined) updates.whScanSessionTotalReads = body.total_reads;
  if (body.metadata !== undefined) updates.whScanSessionMetadata = body.metadata;

  const { data, error } = await supabase
    .from("whScanSession")
    .update(updates)
    .eq("whScanSessionId", id)
    .eq("whScanSessionUserId", session.user.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}
