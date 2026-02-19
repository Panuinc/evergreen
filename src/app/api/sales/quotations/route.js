import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("crmQuotations")
    .select(
      "*, crmContacts(contactFirstName, contactLastName), crmAccounts(accountName), crmOpportunities(opportunityName)"
    );

  if (status) {
    query = query.eq("quotationStatus", status);
  }

  const { data, error } = await query.order("quotationCreatedAt", {
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
    .from("crmQuotations")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
