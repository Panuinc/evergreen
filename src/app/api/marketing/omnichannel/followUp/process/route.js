import { getServiceSupabase } from "@/app/api/_lib/webhookAuth";
import { generateAiReply } from "@/lib/omnichannel/aiAgent";

export async function GET(request) {
  return handleProcess(request);
}

export async function POST(request) {
  return handleProcess(request);
}

async function handleProcess(request) {
  // Support both Vercel Cron (Authorization: Bearer CRON_SECRET) and internal calls (x-internal-secret)
  const authHeader = request.headers.get("authorization");
  const cronSecret = authHeader?.replace("Bearer ", "");
  const internalSecret = request.headers.get("x-internal-secret");

  const isAuthorized =
    (cronSecret && cronSecret === process.env.CRON_SECRET) ||
    (internalSecret && internalSecret === process.env.INTERNAL_API_SECRET);

  if (!isAuthorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  try {
    const now = new Date().toISOString();
    const { data: pendingFollowUps, error } = await supabase
      .from("omFollowUp")
      .select("*, omConversation!inner(omConversationId, omConversationChannelType, omConversationContactId, omContact!inner(omContactExternalId))")
      .eq("omFollowUpStatus", "pending")
      .lte("omFollowUpScheduledAt", now)
      .limit(20);

    if (error) throw error;
    if (!pendingFollowUps || pendingFollowUps.length === 0) {
      return Response.json({ processed: 0 });
    }

    let processed = 0;

    for (const followUp of pendingFollowUps) {
      try {
        let message = followUp.omFollowUpMessage;

        if (!message) {
          message = await generateAiReply(followUp.omFollowUpConversationId, supabase);
        }

        if (!message) continue;

        const conv = followUp.omConversation;
        const channelType = conv.omConversationChannelType;

        const { data: channel } = await supabase
          .from("omChannel")
          .select("*")
          .eq("omChannelType", channelType)
          .eq("omChannelStatus", "active")
          .single();

        if (!channel) continue;

        let externalId = null;

        if (channelType === "facebook") {
          const recipientId = conv.omContact.omContactExternalId;
          const fbRes = await fetch(
            `https://graph.facebook.com/v21.0/me/messages?access_token=${channel.omChannelAccessToken}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipient: { id: recipientId },
                message: { text: message },
              }),
            }
          );
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            externalId = fbData.message_id;
          }
        } else if (channelType === "line") {
          const userId = conv.omContact.omContactExternalId;
          const lineRes = await fetch("https://api.line.me/v2/bot/message/push", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${channel.omChannelAccessToken}`,
            },
            body: JSON.stringify({
              to: userId,
              messages: [{ type: "text", text: message }],
            }),
          });
          if (lineRes.ok) externalId = "line-push";
        }

        await supabase.from("omMessage").insert({
          omMessageConversationId: followUp.omFollowUpConversationId,
          omMessageSenderType: "agent",
          omMessageContent: message,
          omMessageType: "text",
          omMessageExternalId: externalId,
          omMessageIsAi: true,
        });

        await supabase
          .from("omConversation")
          .update({
            omConversationLastMessageAt: new Date().toISOString(),
            omConversationLastMessagePreview: message.slice(0, 100),
            omConversationStatus: "open",
          })
          .eq("omConversationId", followUp.omFollowUpConversationId);

        await supabase
          .from("omFollowUp")
          .update({
            omFollowUpStatus: "sent",
            omFollowUpSentAt: new Date().toISOString(),
          })
          .eq("omFollowUpId", followUp.omFollowUpId);

        processed++;
      } catch (err) {
        console.error(`[FollowUp] Failed to process ${followUp.omFollowUpId}:`, err.message);
      }
    }

    return Response.json({ processed });
  } catch (err) {
    console.error("[FollowUp] Process error:", err.message);
    return Response.json({ error: "Processing failed" }, { status: 500 });
  }
}
