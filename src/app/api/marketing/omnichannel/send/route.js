import { withAuth } from "@/app/api/_lib/auth";

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  const { conversationId, content } = await request.json();

  if (!conversationId || !content?.trim()) {
    return Response.json({ error: "conversationId and content are required" }, { status: 400 });
  }

  // Get conversation + contact
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

  // Get channel credentials
  const { data: channel } = await supabase
    .from("omChannel")
    .select()
    .eq("omChannelType", channelType)
    .eq("omChannelStatus", "active")
    .single();

  if (!channel) {
    return Response.json({ error: `No active ${channelType} channel configured` }, { status: 400 });
  }

  // Send to platform
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
          message: { text: content },
        }),
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
        messages: [{ type: "text", text: content }],
      }),
    });
    sendSuccess = res.ok;
  }

  if (!sendSuccess) {
    return Response.json({ error: "Failed to send message to platform" }, { status: 502 });
  }

  // Insert message to DB
  const { data: message, error: msgError } = await supabase
    .from("omMessage")
    .insert({
      omMessageConversationId: conversationId,
      omMessageSenderType: "agent",
      omMessageSenderId: session.user.id,
      omMessageContent: content,
      omMessageType: "text",
      omMessageExternalId: externalId,
    })
    .select()
    .single();

  if (msgError) {
    return Response.json({ error: msgError.message }, { status: 500 });
  }

  // Update conversation
  await supabase
    .from("omConversation")
    .update({
      omConversationLastMessageAt: new Date().toISOString(),
      omConversationLastMessagePreview: content.slice(0, 100),
      omConversationUnreadCount: 0,
    })
    .eq("omConversationId", conversationId);

  return Response.json(message, { status: 201 });
}
