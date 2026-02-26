import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";
import { extractOrderFromChat } from "@/lib/omnichannel/quotationExtractor";

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
      .from("omQuotation")
      .select("omQuotationId")
      .eq("omQuotationConversationId", conversationId)
      .neq("omQuotationStatus", "cancelled")
      .limit(1)
      .maybeSingle();

    if (existing) {
      console.log("[Quotation] Already exists for conversation:", conversationId);
      return Response.json({ status: "skipped", reason: "quotation already exists" });
    }

    // Get conversation to find contactId
    const { data: conversation } = await supabase
      .from("omConversation")
      .select("omConversationContactId")
      .eq("omConversationId", conversationId)
      .single();

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get messages for extraction
    const { data: messages } = await supabase
      .from("omMessage")
      .select("omMessageSenderType, omMessageContent")
      .eq("omMessageConversationId", conversationId)
      .order("omMessageCreatedAt", { ascending: true });

    if (!messages?.length) {
      return Response.json({ error: "No messages found" }, { status: 400 });
    }

    // AI extract order data
    console.log("[Quotation] Extracting order data for:", conversationId);
    const orderData = await extractOrderFromChat(messages);
    console.log("[Quotation] Extracted:", JSON.stringify(orderData).slice(0, 200));

    // Create quotation
    const { data: quotation, error: qError } = await supabase
      .from("omQuotation")
      .insert({
        omQuotationConversationId: conversationId,
        omQuotationContactId: conversation.omConversationContactId,
        omQuotationNumber: generateQuotationNumber(),
        omQuotationStatus: "draft",
        omQuotationCustomerName: orderData.customerName || null,
        omQuotationCustomerPhone: orderData.customerPhone || null,
        omQuotationCustomerAddress: orderData.customerAddress || null,
        omQuotationPaymentMethod: orderData.paymentMethod || null,
      })
      .select()
      .single();

    if (qError) throw qError;

    // Create quotation lines with price lookup
    if (orderData.items?.length > 0) {
      // Fetch price list for auto-pricing
      const { data: priceList } = await supabase
        .from("omPriceItem")
        .select("omPriceItemName, omPriceItemUnitPrice");

      const lines = orderData.items.map((item, i) => {
        // Try to match product name with price list
        let unitPrice = 0;
        const itemName = (item.productName || "").toLowerCase();
        if (priceList?.length && itemName) {
          const match = priceList.find(
            (p) => p.omPriceItemName && p.omPriceItemName.toLowerCase().includes(itemName) ||
              itemName.includes((p.omPriceItemName || "").toLowerCase())
          );
          if (match && Number(match.omPriceItemUnitPrice) > 0) {
            unitPrice = Number(match.omPriceItemUnitPrice);
          }
        }

        const qty = item.quantity || 1;
        return {
          omQuotationLineQuotationId: quotation.omQuotationId,
          omQuotationLineOrder: i + 1,
          omQuotationLineProductName: item.productName || "สินค้า",
          omQuotationLineVariant: item.variant || null,
          omQuotationLineQuantity: qty,
          omQuotationLineUnitPrice: unitPrice,
          omQuotationLineAmount: qty * unitPrice,
        };
      });

      await supabase.from("omQuotationLine").insert(lines);
    }

    console.log("[Quotation] Created:", quotation.omQuotationNumber);
    return Response.json({
      status: "created",
      quotationId: quotation.omQuotationId,
      quotationNumber: quotation.omQuotationNumber,
    });
  } catch (error) {
    console.error("[Quotation] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
