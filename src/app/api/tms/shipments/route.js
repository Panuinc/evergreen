import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  let query = supabase.from("tmsShipment").select("*");

  if (search) {
    query = query.or(
      `tmsShipmentNumber.ilike.%${search}%,tmsShipmentCustomerName.ilike.%${search}%`
    );
  }

  if (status) {
    query = query.eq("tmsShipmentStatus", status);
  }

  const { data, error } = await query.order("tmsShipmentCreatedAt", {
    ascending: false,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const body = await request.json();
  body.tmsShipmentCreatedBy = session.user.id;

  const { data, error } = await supabase
    .from("tmsShipment")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
