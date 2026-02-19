import { withAuth } from "@/app/api/_lib/auth";

const VALID_TRANSITIONS = {
  submit: { from: ["draft", "rejected"], to: "submitted" },
  approve: { from: ["submitted"], to: "approved" },
  reject: { from: ["submitted"], to: "rejected" },
  convert_order: { from: ["approved"], to: "converted" },
};

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;

  // Fetch quotation with relations
  const { data: quotation, error } = await supabase
    .from("crmQuotations")
    .select(
      "*, crmContacts(contactFirstName, contactLastName), crmAccounts(accountName), crmOpportunities(opportunityName)"
    )
    .eq("quotationId", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  // Fetch lines
  const { data: lines } = await supabase
    .from("crmQuotationLines")
    .select("*")
    .eq("lineQuotationId", id)
    .order("lineOrder", { ascending: true });

  return Response.json({ ...quotation, lines: lines || [] });
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();
  const { lines, ...quotationData } = body;

  // Update quotation
  const { data: quotation, error } = await supabase
    .from("crmQuotations")
    .update(quotationData)
    .eq("quotationId", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  // Update lines if provided
  if (lines) {
    // Delete existing lines
    await supabase.from("crmQuotationLines").delete().eq("lineQuotationId", id);

    // Insert new lines
    if (lines.length > 0) {
      const lineData = lines.map((line, idx) => ({
        lineQuotationId: id,
        lineOrder: idx,
        lineProductName: line.lineProductName,
        lineDescription: line.lineDescription || "",
        lineQuantity: line.lineQuantity || 1,
        lineUnitPrice: line.lineUnitPrice || 0,
        lineDiscount: line.lineDiscount || 0,
        lineAmount: line.lineAmount || 0,
      }));
      await supabase.from("crmQuotationLines").insert(lineData);
    }
  }

  return Response.json(quotation);
}

export async function POST(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { id } = await params;
  const body = await request.json();
  const { action, note } = body;

  const transition = VALID_TRANSITIONS[action];
  if (!transition) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  // Get current quotation
  const { data: quotation, error: fetchError } = await supabase
    .from("crmQuotations")
    .select("*")
    .eq("quotationId", id)
    .single();

  if (fetchError)
    return Response.json({ error: fetchError.message }, { status: 404 });

  if (!transition.from.includes(quotation.quotationStatus)) {
    return Response.json(
      {
        error: `Cannot ${action} from status: ${quotation.quotationStatus}`,
      },
      { status: 400 }
    );
  }

  // Handle convert to order
  if (action === "convert_order") {
    const { data: order, error: orderError } = await supabase
      .from("crmOrders")
      .insert([
        {
          orderQuotationId: id,
          orderOpportunityId: quotation.quotationOpportunityId,
          orderContactId: quotation.quotationContactId,
          orderAccountId: quotation.quotationAccountId,
          orderSubtotal: quotation.quotationSubtotal,
          orderDiscount: quotation.quotationDiscount,
          orderTax: quotation.quotationTax,
          orderTotal: quotation.quotationTotal,
          orderNotes: `Created from quotation ${quotation.quotationNo}`,
          orderCreatedBy: session.user?.email,
        },
      ])
      .select()
      .single();

    if (orderError)
      return Response.json({ error: orderError.message }, { status: 400 });

    // Update quotation status
    await supabase
      .from("crmQuotations")
      .update({ quotationStatus: "converted" })
      .eq("quotationId", id);

    return Response.json(order, { status: 201 });
  }

  // Update status
  const updateData = { quotationStatus: transition.to };
  if (action === "approve") {
    updateData.quotationApprovedBy = session.user?.email;
  }
  if (action === "reject" && note) {
    updateData.quotationApprovalNote = note;
  }

  const { data, error } = await supabase
    .from("crmQuotations")
    .update(updateData)
    .eq("quotationId", id)
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
    .from("crmQuotations")
    .delete()
    .eq("quotationId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
