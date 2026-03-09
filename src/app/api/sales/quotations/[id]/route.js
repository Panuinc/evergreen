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
  const { supabase, isSuperAdmin } = auth;

  const { id } = await params;


  let query = supabase
    .from("salesQuotation")
    .select(
      "*, salesContact(crmContactFirstName, crmContactLastName), salesAccount(crmAccountName), salesOpportunity(crmOpportunityName)"
    )
    .eq("crmQuotationId", id);
  if (!isSuperAdmin) query = query.eq("isActive", true);
  const { data: quotation, error } = await query.single();

  if (error) return Response.json({ error: error.message }, { status: 404 });


  let linesQuery = supabase
    .from("salesQuotationLine")
    .select("*")
    .eq("crmQuotationLineQuotationId", id);
  if (!isSuperAdmin) linesQuery = linesQuery.eq("isActive", true);
  const { data: lines } = await linesQuery.order("crmQuotationLineOrder", { ascending: true });

  return Response.json({ ...quotation, lines: lines || [] });
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const body = await request.json();
  const { lines, ...quotationData } = body;


  const { data: quotation, error } = await supabase
    .from("salesQuotation")
    .update(quotationData)
    .eq("crmQuotationId", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 400 });


  if (lines) {

    await supabase.from("salesQuotationLine").delete().eq("crmQuotationLineQuotationId", id);


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
      await supabase.from("salesQuotationLine").insert(lineData);
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


  const { data: quotation, error: fetchError } = await supabase
    .from("salesQuotation")
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


  if (action === "convert_order") {
    const { data: order, error: orderError } = await supabase
      .from("salesOrder")
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


    await supabase
      .from("salesQuotation")
      .update({ crmQuotationStatus: "converted" })
      .eq("crmQuotationId", id);

    return Response.json(order, { status: 201 });
  }


  const updateData = { crmQuotationStatus: transition.to };
  if (action === "approve") {
    updateData.crmQuotationApprovedBy = session.user?.email;
  }
  if (action === "reject" && note) {
    updateData.crmQuotationApprovalNote = note;
  }

  const { data, error } = await supabase
    .from("salesQuotation")
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


  await supabase
    .from("salesQuotationLine")
    .update({ isActive: false })
    .eq("crmQuotationLineQuotationId", id);


  const { error } = await supabase
    .from("salesQuotation")
    .update({ isActive: false })
    .eq("crmQuotationId", id);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ success: true });
}
