import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get("vehicleId");

  let query = supabase.from("tmsFuelLog").select("*");
  if (!isSuperAdmin) query = query.eq("isActive", true);

  if (vehicleId) {
    query = query.eq("tmsFuelLogVehicleId", vehicleId);
  }

  const { data, error } = await fetchAll(query.order("tmsFuelLogDate", {
    ascending: false,
  }));

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { data, error } = await supabase
    .from("tmsFuelLog")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
