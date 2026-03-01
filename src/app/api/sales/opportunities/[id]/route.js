import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { id } = await params;
  let query = supabase
    .from("crmOpportunity")
    .select(
      "*, crmContact(crmContactFirstName, crmContactLastName), crmAccount(crmAccountName)"
    )
    .eq("crmOpportunityId", id);
  if (!isSuperAdmin) query = query.eq("isActive", true);
  const { data, error } = await query.single();

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
  if (body.crmOpportunityStage === "closed_won" && !body.crmOpportunityActualCloseDate) {
    body.crmOpportunityActualCloseDate = new Date().toISOString().split("T")[0];
    body.crmOpportunityProbability = 100;
  }
  if (body.crmOpportunityStage === "closed_lost" && !body.crmOpportunityActualCloseDate) {
    body.crmOpportunityActualCloseDate = new Date().toISOString().split("T")[0];
    body.crmOpportunityProbability = 0;
  }

  const { data, error } = await supabase
    .from("crmOpportunity")
    .update(body)
    .eq("crmOpportunityId", id)
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
    .from("crmOpportunity")
    .update({ isActive: false })
    .eq("crmOpportunityId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
