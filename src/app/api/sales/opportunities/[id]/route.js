import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { data, error } = await supabase
    .from("crmOpportunities")
    .select(
      "*, crmContacts(contactFirstName, contactLastName), crmAccounts(accountName)"
    )
    .eq("opportunityId", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();

  // If closing as won, set actual close date
  if (body.opportunityStage === "closed_won" && !body.opportunityActualCloseDate) {
    body.opportunityActualCloseDate = new Date().toISOString().split("T")[0];
    body.opportunityProbability = 100;
  }
  if (body.opportunityStage === "closed_lost" && !body.opportunityActualCloseDate) {
    body.opportunityActualCloseDate = new Date().toISOString().split("T")[0];
    body.opportunityProbability = 0;
  }

  const { data, error } = await supabase
    .from("crmOpportunities")
    .update(body)
    .eq("opportunityId", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { error } = await supabase
    .from("crmOpportunities")
    .delete()
    .eq("opportunityId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
