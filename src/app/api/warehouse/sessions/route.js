import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

function formatSession(s) {
  return {
    id: s.whScanSessionId,
    user_id: s.whScanSessionUserId,
    name: s.whScanSessionName,
    type: s.whScanSessionType,
    started_at: s.whScanSessionStartedAt,
    ended_at: s.whScanSessionEndedAt,
    gps_lat: s.whScanSessionGpsLat,
    gps_lon: s.whScanSessionGpsLon,
    tag_count: s.whScanSessionTagCount,
    total_reads: s.whScanSessionTotalReads,
    metadata: s.whScanSessionMetadata,
  };
}

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { data, error } = await fetchAll(supabase
    .from("whScanSession")
    .select("*")
    .eq("whScanSessionUserId", session.user.id)
    .order("whScanSessionStartedAt", { ascending: false }));

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data.map(formatSession));
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
  return Response.json(formatSession(data), { status: 201 });
}
