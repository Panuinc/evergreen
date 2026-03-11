import { getServiceSupabase, verifyInternalSecret } from "@/app/api/_lib/webhookAuth";
import { checkRateLimit } from "@/app/api/_lib/rateLimit";
import { generateAiReply } from "@/lib/omnichannel/aiAgent";
import { sendAiMessage } from "@/lib/omnichannel/aiSender";
import { ocrPaymentSlip } from "@/lib/omnichannel/slipOcr";

export const maxDuration = 60;

export async function POST(request) {
  const rl = checkRateLimit(request, "ai-reply", { maxRequests: 30, windowMs: 60_000 });
  if (rl) return rl;

  if (!verifyInternalSecret(request)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { conversationId } = body;
  if (!conversationId || typeof conversationId !== "string") {
    return Response.json({ error: "conversationId required" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const { data: conv } = await supabase
      .from("omConversation")
      .select("omConversationAiAutoReply")
      .eq("omConversationId", conversationId)
      .single();

    if (!conv?.omConversationAiAutoReply) {
      return Response.json({ status: "skipped", reason: "auto-reply disabled" });
    }

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

    const replyContent = await generateAiReply(conversationId, supabase);
    if (!replyContent?.trim()) {
      return Response.json({ status: "skipped", reason: "empty reply" });
    }

    const message = await sendAiMessage(supabase, conversationId, replyContent);

    if (replyContent.includes("รับออเดอร์เรียบร้อยแล้ว")) {
      await triggerQuotationCreation(conversationId);
    }

    if (replyContent.includes("ได้รับหลักฐานการชำระเงิน")) {
      await supabase
        .from("omConversation")
        .update({ omConversationAiAutoReply: false })
        .eq("omConversationId", conversationId);

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
    return Response.json({ error: "Internal server error" }, { status: 500 });
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
      signal: AbortSignal.timeout(55_000),
    });
  } catch (err) {
    console.error("[Quotation] Failed to trigger:", err.message);
  }
}
