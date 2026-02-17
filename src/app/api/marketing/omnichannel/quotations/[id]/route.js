import { withAuth } from "@/app/api/_lib/auth";
import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";
import { sendAiMessage } from "@/lib/omnichannel/aiSender";

const VALID_TRANSITIONS = {
  submit: { from: ["draft", "rejected"], to: "pending_approval" },
  approve: { from: ["pending_approval"], to: "approved" },
  reject: { from: ["pending_approval"], to: "rejected" },
  confirm_payment: { from: ["approved"], to: "paid" },
};

export async function GET(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  const { data: quotation, error } = await auth.supabase
    .from("omQuotations")
    .select("*, omContacts(contactDisplayName, contactChannelType)")
    .eq("quotationId", id)
    .single();

  if (error || !quotation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { data: lines } = await auth.supabase
    .from("omQuotationLines")
    .select("*")
    .eq("lineQuotationId", id)
    .order("lineOrder", { ascending: true });

  // Fetch payment slip from conversation (latest image with OCR data)
  let paymentSlip = null;
  if (quotation.quotationConversationId && ["approved", "paid"].includes(quotation.quotationStatus)) {
    const { data: slipMsg } = await auth.supabase
      .from("omMessages")
      .select("messageImageUrl, messageOcrData, messageCreatedAt")
      .eq("messageConversationId", quotation.quotationConversationId)
      .eq("messageType", "image")
      .not("messageImageUrl", "is", null)
      .order("messageCreatedAt", { ascending: false })
      .limit(1)
      .single();

    if (slipMsg?.messageImageUrl) {
      paymentSlip = slipMsg;
    }
  }

  return Response.json({ ...quotation, lines: lines || [], paymentSlip });
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();

  // Update quotation fields
  const updateData = {};
  if (body.quotationCustomerName !== undefined) updateData.quotationCustomerName = body.quotationCustomerName;
  if (body.quotationCustomerPhone !== undefined) updateData.quotationCustomerPhone = body.quotationCustomerPhone;
  if (body.quotationCustomerAddress !== undefined) updateData.quotationCustomerAddress = body.quotationCustomerAddress;
  if (body.quotationPaymentMethod !== undefined) updateData.quotationPaymentMethod = body.quotationPaymentMethod;
  if (body.quotationNotes !== undefined) updateData.quotationNotes = body.quotationNotes;

  if (Object.keys(updateData).length > 0) {
    updateData.quotationUpdatedAt = new Date().toISOString();
    const { error } = await auth.supabase
      .from("omQuotations")
      .update(updateData)
      .eq("quotationId", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }

  // Update lines if provided
  if (body.lines) {
    for (const line of body.lines) {
      const amount = (line.lineQuantity || 0) * (line.lineUnitPrice || 0);
      await auth.supabase
        .from("omQuotationLines")
        .update({
          lineProductName: line.lineProductName,
          lineVariant: line.lineVariant,
          lineQuantity: line.lineQuantity,
          lineUnitPrice: line.lineUnitPrice,
          lineAmount: amount,
        })
        .eq("lineId", line.lineId);
    }
  }

  return Response.json({ status: "updated" });
}

export async function PATCH(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { action, note } = await request.json();

  const transition = VALID_TRANSITIONS[action];
  if (!transition) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  // Get current quotation
  const { data: quotation } = await auth.supabase
    .from("omQuotations")
    .select("quotationStatus, quotationConversationId")
    .eq("quotationId", id)
    .single();

  if (!quotation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (!transition.from.includes(quotation.quotationStatus)) {
    return Response.json(
      { error: `Cannot ${action} from status "${quotation.quotationStatus}"` },
      { status: 400 }
    );
  }

  const updateData = {
    quotationStatus: transition.to,
    quotationUpdatedAt: new Date().toISOString(),
  };

  if (action === "submit") {
    updateData.quotationSubmittedBy = auth.session.user.id;
  } else if (action === "approve") {
    updateData.quotationApprovedBy = auth.session.user.id;
  } else if (action === "reject") {
    updateData.quotationApprovalNote = note || "";
  }

  const { error } = await auth.supabase
    .from("omQuotations")
    .update(updateData)
    .eq("quotationId", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // On approve: send quotation link + bank account info to customer
  if (action === "approve") {
    try {
      const serviceSupabase = getServiceSupabase();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const quotationUrl = `${baseUrl}/quotation/${id}`;

      // Send quotation link
      await sendAiMessage(
        serviceSupabase,
        quotation.quotationConversationId,
        `ใบเสนอราคาของท่าน: ${quotationUrl}`
      );

      // Send bank account info if configured
      const { data: aiSettings } = await serviceSupabase
        .from("omAiSettings")
        .select("aiBankAccountInfo")
        .limit(1)
        .single();

      if (aiSettings?.aiBankAccountInfo) {
        await sendAiMessage(
          serviceSupabase,
          quotation.quotationConversationId,
          `รายละเอียดการชำระเงิน:\n${aiSettings.aiBankAccountInfo}\n\nเมื่อชำระเงินแล้ว กรุณาส่งหลักฐานการโอนเงินมาทางแชทนี้ค่ะ`
        );
      }
    } catch (err) {
      console.error("[Quotation] Failed to send link:", err.message);
    }
  }

  // On confirm payment: send confirmation message to customer
  if (action === "confirm_payment") {
    try {
      const serviceSupabase = getServiceSupabase();
      await sendAiMessage(
        serviceSupabase,
        quotation.quotationConversationId,
        `ได้รับการชำระเงินเรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการค่ะ 🙏`
      );
    } catch (err) {
      console.error("[Quotation] Failed to send payment confirmation:", err.message);
    }
  }

  return Response.json({ status: action, newStatus: transition.to });
}
