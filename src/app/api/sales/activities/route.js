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
    .from("crmActivities")
    .select(
      "*, crmContacts(contactFirstName, contactLastName), crmOpportunities(opportunityName), crmAccounts(accountName)"
    );

  if (type) query = query.eq("activityType", type);
  if (status) query = query.eq("activityStatus", status);
  if (contactId) query = query.eq("activityContactId", contactId);
  if (opportunityId)
    query = query.eq("activityOpportunityId", opportunityId);

  const { data, error } = await query.order("activityDueDate", {
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
  if (body.activityId) {
    const { activityId, ...updateData } = body;
    const { data, error } = await supabase
      .from("crmActivities")
      .update(updateData)
      .eq("activityId", activityId)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json(data);
  }

  // Handle delete via POST with deleteId
  if (body.deleteId) {
    const { error } = await supabase
      .from("crmActivities")
      .delete()
      .eq("activityId", body.deleteId);

    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ success: true });
  }

  // Create new activity
  const { data, error } = await supabase
    .from("crmActivities")
    .insert([body])
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data, { status: 201 });
}
