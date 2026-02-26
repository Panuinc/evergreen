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
    .from("crmQuotation")
    .select(
      "*, crmContact(crmContactFirstName, crmContactLastName), crmAccount(crmAccountName), crmOpportunity(crmOpportunityName)"
    )
    .eq("crmQuotationId", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });

  // Fetch lines
  const { data: lines } = await supabase
    .from("crmQuotationLine")
    .select("*")
    .eq("crmQuotationLineQuotationId", id)
    .order("crmQuotationLineOrder", { ascending: true });

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
    .from("crmQuotation")
    .update(quotationData)
    .eq("crmQuotationId", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });

  // Update lines if provided
  if (lines) {
    // Delete existing lines
    await supabase.from("crmQuotationLine").delete().eq("crmQuotationLineQuotationId", id);

    // Insert new lines
    if (lines.length > 0) {
      const lineData = lines.map((line, idx) => ({
        crmQuotationLineQuotationId: id,
        crmQuotationLineOrder: idx,
        crmQuotationLineProductName: line.crmQuotationLineProductName,
        crmQuotationLineDescription: line.crmQuotationLineDescription || "",
        crmQuotationLineQuantity: line.crmQuotationLineQuantity || 1,
        crmQuotationLineUnitPrice: line.crmQuotationLineUnitPrice || 0,
        crmQuotationLineDiscount: line.crmQuotationLineDiscount || 0,
        crmQuotationLineAmount: line.crmQuotationLineAmount || 0,
      }));
      await supabase.from("crmQuotationLine").insert(lineData);
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
    .from("crmQuotation")
    .select("*")
    .eq("crmQuotationId", id)
    .single();

  if (fetchError)
    return Response.json({ error: fetchError.message }, { status: 404 });

  if (!transition.from.includes(quotation.crmQuotationStatus)) {
    return Response.json(
      {
        error: `Cannot ${action} from status: ${quotation.crmQuotationStatus}`,
      },
      { status: 400 }
    );
  }

  // Handle convert to order
  if (action === "convert_order") {
    const { data: order, error: orderError } = await supabase
      .from("crmOrder")
      .insert([
        {
          crmOrderQuotationId: id,
          crmOrderOpportunityId: quotation.crmQuotationOpportunityId,
          crmOrderContactId: quotation.crmQuotationContactId,
          crmOrderAccountId: quotation.crmQuotationAccountId,
          crmOrderSubtotal: quotation.crmQuotationSubtotal,
          crmOrderDiscount: quotation.crmQuotationDiscount,
          crmOrderTax: quotation.crmQuotationTax,
          crmOrderTotal: quotation.crmQuotationTotal,
          crmOrderNotes: `Created from quotation ${quotation.crmQuotationNo}`,
          crmOrderCreatedBy: session.user?.email,
        },
      ])
      .select()
      .single();

    if (orderError)
      return Response.json({ error: orderError.message }, { status: 400 });

    // Update quotation status
    await supabase
      .from("crmQuotation")
      .update({ crmQuotationStatus: "converted" })
      .eq("crmQuotationId", id);

    return Response.json(order, { status: 201 });
  }

  // Update status
  const updateData = { crmQuotationStatus: transition.to };
  if (action === "approve") {
    updateData.crmQuotationApprovedBy = session.user?.email;
  }
  if (action === "reject" && note) {
    updateData.crmQuotationApprovalNote = note;
  }

  const { data, error } = await supabase
    .from("crmQuotation")
    .update(updateData)
    .eq("crmQuotationId", id)
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
    .from("crmQuotation")
    .delete()
    .eq("crmQuotationId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
