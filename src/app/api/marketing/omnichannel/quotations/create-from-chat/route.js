import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";
import { extractOrderFromChat } from "@/lib/omnichannel/quotationExtractor";
import { sendAiMessage } from "@/lib/omnichannel/aiSender";

export const maxDuration = 60;

function generateQuotationNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 9999)).padStart(4, "0");
  return `QT-${y}${m}${day}-${rand}`;
}

export async function POST(request) {
  const authHeader = request.headers.get("x-internal-secret");
  if (authHeader !== process.env.INTERNAL_API_SECRET) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { conversationId } = await request.json();
  if (!conversationId) {
    return Response.json({ error: "conversationId required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  try {
    // Check for existing quotation (prevent duplicates)
    const { data: existing } = await supabase
      .from("omQuotations")
      .select("quotationId")
      .eq("quotationConversationId", conversationId)
      .neq("quotationStatus", "cancelled")
      .limit(1)
      .maybeSingle();

    if (existing) {
      console.log("[Quotation] Already exists for conversation:", conversationId);
      return Response.json({ status: "skipped", reason: "quotation already exists" });
    }

    // Get conversation to find contactId
    const { data: conversation } = await supabase
      .from("omConversations")
      .select("conversationContactId")
      .eq("conversationId", conversationId)
      .single();

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get messages for extraction
    const { data: messages } = await supabase
      .from("omMessages")
      .select("messageSenderType, messageContent")
      .eq("messageConversationId", conversationId)
      .order("messageCreatedAt", { ascending: true });

    if (!messages?.length) {
      return Response.json({ error: "No messages found" }, { status: 400 });
    }

    // AI extract order data
    console.log("[Quotation] Extracting order data for:", conversationId);
    const orderData = await extractOrderFromChat(messages);
    console.log("[Quotation] Extracted:", JSON.stringify(orderData).slice(0, 200));

    // Create quotation
    const { data: quotation, error: qError } = await supabase
      .from("omQuotations")
      .insert({
        quotationConversationId: conversationId,
        quotationContactId: conversation.conversationContactId,
        quotationNumber: generateQuotationNumber(),
        quotationStatus: "draft",
        quotationCustomerName: orderData.customerName || null,
        quotationCustomerPhone: orderData.customerPhone || null,
        quotationCustomerAddress: orderData.customerAddress || null,
        quotationPaymentMethod: orderData.paymentMethod || null,
      })
      .select()
      .single();

    if (qError) throw qError;

    // Create quotation lines
    if (orderData.items?.length > 0) {
      const lines = orderData.items.map((item, i) => ({
        lineQuotationId: quotation.quotationId,
        lineOrder: i + 1,
        lineProductName: item.productName || "สินค้า",
        lineVariant: item.variant || null,
        lineQuantity: item.quantity || 1,
        lineUnitPrice: 0,
        lineAmount: 0,
      }));

      await supabase.from("omQuotationLines").insert(lines);
    }

    // Send quotation link to customer
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const quotationUrl = `${baseUrl}/quotation/${quotation.quotationId}`;
    await sendAiMessage(
      supabase,
      conversationId,
      `ใบเสนอราคาของท่าน: ${quotationUrl}`
    );

    console.log("[Quotation] Created:", quotation.quotationNumber);
    return Response.json({
      status: "created",
      quotationId: quotation.quotationId,
      quotationNumber: quotation.quotationNumber,
    });
  } catch (error) {
    console.error("[Quotation] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
