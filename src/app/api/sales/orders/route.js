import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  let query = supabase
    .from("crmOrder")
    .select(
      "*, crmContact(crmContactFirstName, crmContactLastName), crmAccount(crmAccountName), crmQuotation(crmQuotationNo)"
    );
  if (!isSuperAdmin) query = query.eq("isActive", true);

  if (search) {
    query = query.or(
      `crmOrderNo.ilike.%${search}%,crmOrderShippingAddress.ilike.%${search}%,crmOrderTrackingNumber.ilike.%${search}%`
    );
  }

  if (status) {
    query = query.eq("crmOrderStatus", status);
  }

  const { data, error } = await query.order("crmOrderCreatedAt", {
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
    .from("crmOrder")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
