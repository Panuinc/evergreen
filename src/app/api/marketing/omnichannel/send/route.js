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
    .from("omConversations")
    .select("*, omContacts(*)")
    .eq("conversationId", conversationId)
    .single();

  if (convError || !conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  const contact = conversation.omContacts;
  const channelType = conversation.conversationChannelType;

  // Get channel credentials
  const { data: channel } = await supabase
    .from("omChannels")
    .select()
    .eq("channelType", channelType)
    .eq("channelStatus", "active")
    .single();

  if (!channel) {
    return Response.json({ error: `No active ${channelType} channel configured` }, { status: 400 });
  }

  // Send to platform
  let sendSuccess = false;
  let externalId = null;

  if (channelType === "facebook") {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${channel.channelAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: contact.contactExternalId },
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
        Authorization: `Bearer ${channel.channelAccessToken}`,
      },
      body: JSON.stringify({
        to: contact.contactExternalId,
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
    .from("omMessages")
    .insert({
      messageConversationId: conversationId,
      messageSenderType: "agent",
      messageSenderId: session.user.id,
      messageContent: content,
      messageType: "text",
      messageExternalId: externalId,
    })
    .select()
    .single();

  if (msgError) {
    return Response.json({ error: msgError.message }, { status: 500 });
  }

  // Update conversation
  await supabase
    .from("omConversations")
    .update({
      conversationLastMessageAt: new Date().toISOString(),
      conversationLastMessagePreview: content.slice(0, 100),
      conversationUnreadCount: 0,
    })
    .eq("conversationId", conversationId);

  return Response.json(message, { status: 201 });
}
