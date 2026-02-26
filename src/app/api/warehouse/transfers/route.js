import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { data, error } = await supabase
    .from("whTransfer")
    .select("*")
    .eq("whTransferUserId", session.user.id)
    .order("whTransferCreatedAt", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
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
  return Response.json(data, { status: 201 });
}
