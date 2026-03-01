import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const vehicleId = searchParams.get("vehicleId");

  let query = supabase.from("tmsMaintenance").select("*");
  if (!isSuperAdmin) query = query.eq("isActive", true);

  if (search) {
    query = query.or(
      `tmsMaintenanceDescription.ilike.%${search}%,tmsMaintenanceVendor.ilike.%${search}%`
    );
  }

  if (vehicleId) {
    query = query.eq("tmsMaintenanceVehicleId", vehicleId);
  }

  const { data, error } = await query.order("tmsMaintenanceDate", {
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
    .from("tmsMaintenance")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
