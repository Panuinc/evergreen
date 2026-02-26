import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";
import { generateAiReply } from "@/lib/omnichannel/aiAgent";
import { sendAiMessage } from "@/lib/omnichannel/aiSender";
import { ocrPaymentSlip } from "@/lib/omnichannel/slipOcr";

export const maxDuration = 60;

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
    // Debounce: wait 1 second for rapid messages
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Re-check if auto-reply is still enabled
    const { data: conv } = await supabase
      .from("omConversation")
      .select("omConversationAiAutoReply")
      .eq("omConversationId", conversationId)
      .single();

    if (!conv?.omConversationAiAutoReply) {
      return Response.json({ status: "skipped", reason: "auto-reply disabled" });
    }

    // Check if the latest message is still from a customer (agent may have replied)
    const { data: latestMsg } = await supabase
      .from("omMessage")
      .select("omMessageSenderType")
      .eq("omMessageConversationId", conversationId)
      .order("omMessageCreatedAt", { ascending: false })
      .limit(1)
      .single();

    if (latestMsg?.omMessageSenderType !== "customer") {
      return Response.json({ status: "skipped", reason: "agent already replied" });
    }

    // Generate AI reply
    const replyContent = await generateAiReply(conversationId, supabase);
    if (!replyContent?.trim()) {
      return Response.json({ status: "skipped", reason: "empty reply" });
    }

    // Send the reply
    const message = await sendAiMessage(supabase, conversationId, replyContent);

    // Trigger quotation creation if order confirmed
    if (replyContent.includes("รับออเดอร์เรียบร้อยแล้ว")) {
      await triggerQuotationCreation(conversationId);
    }

    // Turn off auto-reply when payment slip received (staff takes over)
    if (replyContent.includes("ได้รับหลักฐานการชำระเงิน")) {
      await supabase
        .from("omConversation")
        .update({ omConversationAiAutoReply: false })
        .eq("omConversationId", conversationId);

      // OCR the payment slip image
      const { data: imgMsg } = await supabase
        .from("omMessage")
        .select("omMessageId, omMessageImageUrl")
        .eq("omMessageConversationId", conversationId)
        .eq("omMessageType", "image")
        .order("omMessageCreatedAt", { ascending: false })
        .limit(1)
        .single();

      if (imgMsg?.omMessageImageUrl) {
        const ocrData = await ocrPaymentSlip(imgMsg.omMessageImageUrl);
        if (ocrData) {
          await supabase
            .from("omMessage")
            .update({ omMessageOcrData: ocrData })
            .eq("omMessageId", imgMsg.omMessageId);
        }
      }
    }

    return Response.json({ status: "sent", messageId: message.omMessageId });
  } catch (error) {
    console.error("[AI Reply] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function triggerQuotationCreation(conversationId) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    await fetch(`${baseUrl}/api/marketing/omnichannel/quotations/createFromChat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET,
      },
      body: JSON.stringify({ conversationId }),
    });
  } catch (err) {
    console.error("[Quotation] Failed to trigger:", err.message);
  }
}
