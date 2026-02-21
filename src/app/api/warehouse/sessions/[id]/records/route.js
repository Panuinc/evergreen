import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  const { data, error } = await supabase
    .from("scanRecords")
    .select("*")
    .eq("session_id", id)
    .order("scanned_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();

  if (!Array.isArray(body)) {
    return Response.json(
      { error: "Request body must be an array of records" },
      { status: 400 }
    );
  }

  const records = body.map((item) => ({
    session_id: id,
    epc: item.epc,
    rssi: item.rssi,
    item_number: item.item_number,
    item_name: item.item_name,
    photo_url: item.photo_url,
    read_count: item.read_count,
    scanned_at: item.scanned_at,
  }));

  const { data, error } = await supabase
    .from("scanRecords")
    .insert(records)
    .select();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
