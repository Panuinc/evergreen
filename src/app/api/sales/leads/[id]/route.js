import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { data, error } = await supabase
    .from("crmLeads")
    .select("*")
    .eq("leadId", id)
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
  const { data, error } = await supabase
    .from("crmLeads")
    .update(body)
    .eq("leadId", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();

  if (body.action === "convert") {
    // Get the lead
    const { data: lead, error: leadError } = await supabase
      .from("crmLeads")
      .select("*")
      .eq("leadId", id)
      .single();

    if (leadError)
      return Response.json({ error: leadError.message }, { status: 404 });

    if (lead.leadStatus === "converted") {
      return Response.json(
        { error: "Lead is already converted" },
        { status: 400 }
      );
    }

    // Create contact from lead
    const { data: contact, error: contactError } = await supabase
      .from("crmContacts")
      .insert([
        {
          contactFirstName: lead.leadName.split(" ")[0] || lead.leadName,
          contactLastName: lead.leadName.split(" ").slice(1).join(" ") || "",
          contactEmail: lead.leadEmail,
          contactPhone: lead.leadPhone,
          contactPosition: lead.leadPosition,
          contactNotes: `Converted from lead ${lead.leadNo}`,
        },
      ])
      .select()
      .single();

    if (contactError)
      return Response.json({ error: contactError.message }, { status: 400 });

    // Create opportunity from lead
    const { data: opportunity, error: oppError } = await supabase
      .from("crmOpportunities")
      .insert([
        {
          opportunityName: `${lead.leadName} - Opportunity`,
          opportunityStage: "prospecting",
          opportunityContactId: contact.contactId,
          opportunityAssignedTo: lead.leadAssignedTo,
          opportunitySource: lead.leadSource,
          opportunityNotes: `Converted from lead ${lead.leadNo}`,
        },
      ])
      .select()
      .single();

    if (oppError)
      return Response.json({ error: oppError.message }, { status: 400 });

    // Update lead status
    await supabase
      .from("crmLeads")
      .update({
        leadStatus: "converted",
        leadConvertedContactId: contact.contactId,
        leadConvertedOpportunityId: opportunity.opportunityId,
      })
      .eq("leadId", id);

    return Response.json({ contact, opportunity }, { status: 201 });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { error } = await supabase
    .from("crmLeads")
    .delete()
    .eq("leadId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
