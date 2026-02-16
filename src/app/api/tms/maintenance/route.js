import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const vehicleId = searchParams.get("vehicleId");

  let query = supabase.from("maintenances").select("*");

  if (search) {
    query = query.or(
      `maintenanceDescription.ilike.%${search}%,maintenanceVendor.ilike.%${search}%`
    );
  }

  if (vehicleId) {
    query = query.eq("maintenanceVehicleId", vehicleId);
  }

  const { data, error } = await query.order("maintenanceDate", {
    ascending: false,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();
  const { data, error } = await supabase
    .from("maintenances")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
