import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const contactId = searchParams.get("contactId");
  const opportunityId = searchParams.get("opportunityId");

  let query = supabase
    .from("crmActivity")
    .select(
      "*, crmContact(crmContactFirstName, crmContactLastName), crmOpportunity(crmOpportunityName), crmAccount(crmAccountName)"
    );

  if (type) query = query.eq("crmActivityType", type);
  if (status) query = query.eq("crmActivityStatus", status);
  if (contactId) query = query.eq("crmActivityContactId", contactId);
  if (opportunityId)
    query = query.eq("crmActivityOpportunityId", opportunityId);

  const { data, error } = await query.order("crmActivityDueDate", {
    ascending: true,
    nullsFirst: false,
  });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const body = await request.json();

  // Handle update via POST with id
  if (body.crmActivityId) {
    const { crmActivityId, ...updateData } = body;
    const { data, error } = await supabase
      .from("crmActivity")
      .update(updateData)
      .eq("crmActivityId", crmActivityId)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json(data);
  }

  // Handle delete via POST with deleteId
  if (body.deleteId) {
    const { error } = await supabase
      .from("crmActivity")
      .delete()
      .eq("crmActivityId", body.deleteId);

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ success: true });
  }

  // Create new activity
  const { data, error } = await supabase
    .from("crmActivity")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
