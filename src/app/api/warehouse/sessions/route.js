import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { data, error } = await supabase
    .from("whScanSession")
    .select("*")
    .eq("whScanSessionUserId", session.user.id)
    .order("whScanSessionStartedAt", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();

  const record = {
    whScanSessionUserId: session.user.id,
    whScanSessionName: body.name,
    whScanSessionType: body.type,
    whScanSessionStartedAt: body.started_at,
    whScanSessionEndedAt: body.ended_at,
    whScanSessionGpsLat: body.gps_lat,
    whScanSessionGpsLon: body.gps_lon,
    whScanSessionTagCount: body.tag_count,
    whScanSessionTotalReads: body.total_reads,
    whScanSessionMetadata: body.metadata,
  };

  const { data, error } = await supabase
    .from("whScanSession")
    .insert([record])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
