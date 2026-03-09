import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");
  const shipmentId = searchParams.get("shipmentId");
  const date = searchParams.get("date"); // YYYY-MM-DD

  let query = supabase.from("tmsGpsLog").select("*");

  if (vehicleId) {
    query = query.eq("tmsGpsLogVehicleId", vehicleId);
  }

  if (shipmentId) {
    query = query.eq("tmsGpsLogShipmentId", shipmentId);
  }

  if (date) {
    // Data is stored in UTC; Thailand is UTC+7, so shift the window back 7 hours
    const start = new Date(`${date}T00:00:00.000+07:00`).toISOString();
    const end = new Date(`${date}T23:59:59.999+07:00`).toISOString();
    query = query.gte("tmsGpsLogRecordedAt", start).lte("tmsGpsLogRecordedAt", end);
  }

  const { data, error } = await query
    .order("tmsGpsLogRecordedAt", { ascending: false })
    .limit(date ? 2000 : 100);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { data, error } = await supabase
    .from("tmsGpsLog")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
