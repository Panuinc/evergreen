import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { data, error } = await supabase
    .from("scanSessions")
    .select("*")
    .eq("user_id", session.user.id)
    .order("started_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();

  const record = {
    user_id: session.user.id,
    name: body.name,
    type: body.type,
    started_at: body.started_at,
    ended_at: body.ended_at,
    gps_lat: body.gps_lat,
    gps_lon: body.gps_lon,
    tag_count: body.tag_count,
    total_reads: body.total_reads,
    metadata: body.metadata,
  };

  const { data, error } = await supabase
    .from("scanSessions")
    .insert([record])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
