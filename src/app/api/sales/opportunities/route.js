import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const stage = searchParams.get("stage");

  let query = supabase
    .from("crmOpportunities")
    .select(
      "*, crmContacts(contactFirstName, contactLastName), crmAccounts(accountName)"
    );

  if (search) {
    query = query.or(
      `opportunityName.ilike.%${search}%,opportunityAssignedTo.ilike.%${search}%`
    );
  }

  if (stage) {
    query = query.eq("opportunityStage", stage);
  }

  const { data, error } = await query.order("opportunityCreatedAt", {
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
    .from("crmOpportunities")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
