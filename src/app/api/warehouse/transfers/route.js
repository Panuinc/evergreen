import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { data, error } = await supabase
    .from("whTransfer")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

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
  const transfer_no = `TRF-${datePart}-${randomPart}`;

  const record = {
    user_id: session.user.id,
    transfer_no,
    from_location: body.from_location,
    to_location: body.to_location,
    session_id: body.session_id,
    notes: body.notes,
    gps_lat: body.gps_lat,
    gps_lon: body.gps_lon,
    status: "pending",
  };

  const { data, error } = await supabase
    .from("whTransfer")
    .insert([record])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
