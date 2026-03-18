import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

function formatTransfer(t) {
  return {
    id: t.whTransferId,
    user_id: t.whTransferUserId,
    no: t.whTransferNo,
    from_location: t.whTransferFromLocation,
    to_location: t.whTransferToLocation,
    session_id: t.whTransferSessionId,
    notes: t.whTransferNotes,
    gps_lat: t.whTransferGpsLat,
    gps_lon: t.whTransferGpsLon,
    status: t.whTransferStatus,
    created_at: t.whTransferCreatedAt,
  };
}

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { data, error } = await fetchAll(supabase
    .from("whTransfer")
    .select("*")
    .eq("whTransferUserId", session.user.id)
    .order("whTransferCreatedAt", { ascending: false }));

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data.map(formatTransfer));
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();

  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const randomPart = String(Math.floor(1000 + Math.random() * 9000));
  const transferNo = `TRF-${datePart}-${randomPart}`;

  const record = {
    whTransferUserId: session.user.id,
    whTransferNo: transferNo,
    whTransferFromLocation: body.from_location,
    whTransferToLocation: body.to_location,
    whTransferSessionId: body.session_id,
    whTransferNotes: body.notes,
    whTransferGpsLat: body.gps_lat,
    whTransferGpsLon: body.gps_lon,
    whTransferStatus: "pending",
  };

  const { data, error } = await supabase
    .from("whTransfer")
    .insert([record])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(formatTransfer(data), { status: 201 });
}
