import { withAuth } from "@/app/api/_lib/auth";
import { checkRateLimit } from "@/app/api/_lib/rateLimit";

const MAX_MESSAGE_LENGTH = 5000;

export async function POST(request) {
  const rl = checkRateLimit(request, "om-send", { maxRequests: 30, windowMs: 60_000 });
  if (rl) return rl;

  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { conversationId, content } = body;

  if (!conversationId || typeof conversationId !== "string") {
    return Response.json({ error: "conversationId is required" }, { status: 400 });
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  const sanitizedContent = content.trim().slice(0, MAX_MESSAGE_LENGTH);

  const { data: conversation, error: convError } = await supabase
    .from("omConversation")
    .select("*, omContact(*)")
    .eq("omConversationId", conversationId)
    .single();

  if (convError || !conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  const contact = conversation.omContact;
  const channelType = conversation.omConversationChannelType;

  const { data: channel } = await supabase
    .from("omChannel")
    .select()
    .eq("omChannelType", channelType)
    .eq("omChannelStatus", "active")
    .single();

  if (!channel) {
    return Response.json({ error: `No active ${channelType} channel configured` }, { status: 400 });
  }

  let sendSuccess = false;
  let externalId = null;

  if (channelType === "facebook") {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${channel.omChannelAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: contact.omContactExternalId },
          message: { text: sanitizedContent },
        }),
        signal: AbortSignal.timeout(15_000),
      }
    );
    const result = await res.json();
    sendSuccess = res.ok;
    externalId = result.message_id;
  } else if (channelType === "line") {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channel.omChannelAccessToken}`,
      },
      body: JSON.stringify({
        to: contact.omContactExternalId,
        messages: [{ type: "text", text: sanitizedContent }],
      }),
      signal: AbortSignal.timeout(15_000),
    });
    sendSuccess = res.ok;
  }

  if (!sendSuccess) {
    return Response.json({ error: "Failed to send message to platform" }, { status: 502 });
  }

  const { data: message, error: msgError } = await supabase
    .from("omMessage")
    .insert({
      omMessageConversationId: conversationId,
      omMessageSenderType: "agent",
      omMessageSenderId: session.user.id,
      omMessageContent: sanitizedContent,
      omMessageType: "text",
      omMessageExternalId: externalId,
    })
    .select()
    .single();

  if (msgError) {
    return Response.json({ error: "Failed to save message" }, { status: 500 });
  }

  await supabase
    .from("omConversation")
    .update({
      omConversationLastMessageAt: new Date().toISOString(),
      omConversationLastMessagePreview: sanitizedContent.slice(0, 100),
      omConversationUnreadCount: 0,
    })
    .eq("omConversationId", conversationId);

  return Response.json(message, { status: 201 });
}
