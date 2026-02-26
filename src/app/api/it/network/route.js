import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  let query = supabase.from("itNetworkDevice").select("*");

  if (search) {
    query = query.or(
      `itNetworkDeviceName.ilike.%${search}%,itNetworkDeviceIpAddress.ilike.%${search}%,itNetworkDeviceLocation.ilike.%${search}%`
    );
  }

  const { data, error } = await query.order("itNetworkDeviceCreatedAt", {
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
    .from("itNetworkDevice")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
