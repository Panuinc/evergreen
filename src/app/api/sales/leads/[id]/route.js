import { withAuth } from "@/app/api/_lib/auth";

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, isSuperAdmin } = auth;

  const { id } = await params;
  let query = supabase
    .from("crmLead")
    .select("*")
    .eq("crmLeadId", id);
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
  const { data, error } = await supabase
    .from("crmLead")
    .update(body)
    .eq("crmLeadId", id)
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
      .from("crmLead")
      .select("*")
      .eq("crmLeadId", id)
      .single();

    if (leadError)
      return Response.json({ error: leadError.message }, { status: 404 });

    if (lead.crmLeadStatus === "converted") {
      return Response.json(
        { error: "Lead is already converted" },
        { status: 400 }
      );
    }

    // Create contact from lead
    const { data: contact, error: contactError } = await supabase
      .from("crmContact")
      .insert([
        {
          crmContactFirstName: lead.crmLeadName.split(" ")[0] || lead.crmLeadName,
          crmContactLastName: lead.crmLeadName.split(" ").slice(1).join(" ") || "",
          crmContactEmail: lead.crmLeadEmail,
          crmContactPhone: lead.crmLeadPhone,
          crmContactPosition: lead.crmLeadPosition,
          crmContactNotes: `Converted from lead ${lead.crmLeadNo}`,
        },
      ])
      .select()
      .single();

    if (contactError)
      return Response.json({ error: contactError.message }, { status: 400 });

    // Create opportunity from lead
    const { data: opportunity, error: oppError } = await supabase
      .from("crmOpportunity")
      .insert([
        {
          crmOpportunityName: `${lead.crmLeadName} - Opportunity`,
          crmOpportunityStage: "prospecting",
          crmOpportunityContactId: contact.crmContactId,
          crmOpportunityAssignedTo: lead.crmLeadAssignedTo,
          crmOpportunitySource: lead.crmLeadSource,
          crmOpportunityNotes: `Converted from lead ${lead.crmLeadNo}`,
        },
      ])
      .select()
      .single();

    if (oppError)
      return Response.json({ error: oppError.message }, { status: 400 });

    // Update lead status
    await supabase
      .from("crmLead")
      .update({
        crmLeadStatus: "converted",
        crmLeadConvertedContactId: contact.crmContactId,
        crmLeadConvertedOpportunityId: opportunity.crmOpportunityId,
      })
      .eq("crmLeadId", id);

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
    .from("crmLead")
    .update({ isActive: false })
    .eq("crmLeadId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
