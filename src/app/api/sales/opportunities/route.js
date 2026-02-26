import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const stage = searchParams.get("stage");

  let query = supabase
    .from("crmOpportunity")
    .select(
      "*, crmContact(crmContactFirstName, crmContactLastName), crmAccount(crmAccountName)"
    );

  if (search) {
    query = query.or(
      `crmOpportunityName.ilike.%${search}%,crmOpportunityAssignedTo.ilike.%${search}%`
    );
  }

  if (stage) {
    query = query.eq("crmOpportunityStage", stage);
  }

  const { data, error } = await query.order("crmOpportunityCreatedAt", {
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
    .from("crmOpportunity")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
