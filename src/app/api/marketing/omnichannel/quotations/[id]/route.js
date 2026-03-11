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
    .from("omQuotation")
    .select("*, omContact(omContactDisplayName, omContactChannelType)")
    .eq("omQuotationId", id)
    .single();

  if (error || !quotation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { data: lines } = await auth.supabase
    .from("omQuotationLine")
    .select("*")
    .eq("omQuotationLineQuotationId", id)
    .order("omQuotationLineOrder", { ascending: true });

  let paymentSlip = null;
  if (quotation.omQuotationConversationId && ["approved", "paid"].includes(quotation.omQuotationStatus)) {
    const { data: slipMsg } = await auth.supabase
      .from("omMessage")
      .select("omMessageImageUrl, omMessageOcrData, omMessageCreatedAt")
      .eq("omMessageConversationId", quotation.omQuotationConversationId)
      .eq("omMessageType", "image")
      .not("omMessageImageUrl", "is", null)
      .order("omMessageCreatedAt", { ascending: false })
      .limit(1)
      .single();

    if (slipMsg?.omMessageImageUrl) {
      paymentSlip = slipMsg;
    }
  }

  return Response.json({ ...quotation, lines: lines || [], paymentSlip });
}

export async function PUT(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updateData = {};
  const strFields = [
    "omQuotationCustomerName",
    "omQuotationCustomerPhone",
    "omQuotationCustomerAddress",
    "omQuotationPaymentMethod",
    "omQuotationNotes",
  ];
  for (const field of strFields) {
    if (body[field] !== undefined) {
      if (body[field] !== null && typeof body[field] !== "string") {
        return Response.json({ error: `Invalid ${field}` }, { status: 400 });
      }
      updateData[field] = body[field] ? String(body[field]).slice(0, 1000) : body[field];
    }
  }

  if (Object.keys(updateData).length > 0) {
    updateData.omQuotationUpdatedAt = new Date().toISOString();
    const { error } = await auth.supabase
      .from("omQuotation")
      .update(updateData)
      .eq("omQuotationId", id);
    if (error) return Response.json({ error: "Update failed" }, { status: 500 });
  }

  if (Array.isArray(body.lines)) {
    for (const line of body.lines.slice(0, 50)) {
      if (!line.omQuotationLineId || typeof line.omQuotationLineId !== "string") continue;

      const qty = Number(line.omQuotationLineQuantity) || 0;
      const price = Number(line.omQuotationLineUnitPrice) || 0;
      if (qty < 0 || price < 0 || qty > 999999 || price > 999999999) continue;

      const amount = qty * price;
      await auth.supabase
        .from("omQuotationLine")
        .update({
          omQuotationLineProductName: String(line.omQuotationLineProductName || "").slice(0, 500),
          omQuotationLineVariant: line.omQuotationLineVariant ? String(line.omQuotationLineVariant).slice(0, 500) : null,
          omQuotationLineQuantity: qty,
          omQuotationLineUnitPrice: price,
          omQuotationLineAmount: amount,
        })
        .eq("omQuotationLineId", line.omQuotationLineId)
        .eq("omQuotationLineQuotationId", id);
    }
  }

  return Response.json({ status: "updated" });
}

export async function PATCH(request, { params }) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, note } = body;

  if (typeof action !== "string" || !VALID_TRANSITIONS[action]) {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  const transition = VALID_TRANSITIONS[action];

  const { data: quotation } = await auth.supabase
    .from("omQuotation")
    .select("omQuotationStatus, omQuotationConversationId")
    .eq("omQuotationId", id)
    .single();

  if (!quotation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (!transition.from.includes(quotation.omQuotationStatus)) {
    return Response.json(
      { error: `Cannot ${action} from status "${quotation.omQuotationStatus}"` },
      { status: 400 }
    );
  }

  const updateData = {
    omQuotationStatus: transition.to,
    omQuotationUpdatedAt: new Date().toISOString(),
  };

  if (action === "submit") {
    updateData.omQuotationSubmittedBy = auth.session.user.id;
  } else if (action === "approve") {
    updateData.omQuotationApprovedBy = auth.session.user.id;
  } else if (action === "reject") {
    updateData.omQuotationApprovalNote = typeof note === "string" ? note.slice(0, 1000) : "";
  }

  const { error } = await auth.supabase
    .from("omQuotation")
    .update(updateData)
    .eq("omQuotationId", id);

  if (error) {
    return Response.json({ error: "Update failed" }, { status: 500 });
  }

  if (action === "approve") {
    try {
      const serviceSupabase = getServiceSupabase();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const quotationUrl = `${baseUrl}/quotation/${id}`;

      await sendAiMessage(
        serviceSupabase,
        quotation.omQuotationConversationId,
        `ใบเสนอราคาของท่าน: ${quotationUrl}`
      );

      const { data: aiSettings } = await serviceSupabase
        .from("omAiSetting")
        .select("omAiSettingBankAccountInfo")
        .limit(1)
        .single();

      if (aiSettings?.omAiSettingBankAccountInfo) {
        await sendAiMessage(
          serviceSupabase,
          quotation.omQuotationConversationId,
          `รายละเอียดการชำระเงิน:\n${aiSettings.omAiSettingBankAccountInfo}\n\nเมื่อชำระเงินแล้ว กรุณาส่งหลักฐานการโอนเงินมาทางแชทนี้ค่ะ`
        );
      }
    } catch (err) {
      console.error("[Quotation] Failed to send link:", err.message);
    }
  }

  if (action === "confirm_payment") {
    try {
      const serviceSupabase = getServiceSupabase();
      await sendAiMessage(
        serviceSupabase,
        quotation.omQuotationConversationId,
        `ได้รับการชำระเงินเรียบร้อยแล้วค่ะ ขอบคุณที่ใช้บริการค่ะ 🙏`
      );
    } catch (err) {
      console.error("[Quotation] Failed to send payment confirmation:", err.message);
    }
  }

  return Response.json({ status: action, newStatus: transition.to });
}
