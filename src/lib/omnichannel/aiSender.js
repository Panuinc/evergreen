export async function sendMessageToChannel(channelType, channelAccessToken, recipientExternalId, content) {
  if (channelType === "facebook") {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${channelAccessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientExternalId },
          message: { text: content },
        }),
      }
    );
    const result = await res.json();
    return { success: res.ok, externalId: result.message_id || null };
  }

  if (channelType === "line") {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify({
        to: recipientExternalId,
        messages: [{ type: "text", text: content }],
      }),
    });
    return { success: res.ok, externalId: null };
  }

  return { success: false, externalId: null };
}

export async function sendAiMessage(supabase, conversationId, content) {
  // Get conversation + contact
  const { data: conversation } = await supabase
    .from("omConversations")
    .select("*, omContacts(*)")
    .eq("conversationId", conversationId)
    .single();

  if (!conversation) throw new Error("Conversation not found");

  const contact = conversation.omContacts;
  const channelType = conversation.conversationChannelType;

  // Get channel credentials
  const { data: channel } = await supabase
    .from("omChannels")
    .select()
    .eq("channelType", channelType)
    .eq("channelStatus", "active")
    .single();

  if (!channel) throw new Error(`No active ${channelType} channel`);

  // Send to platform
  const { success, externalId } = await sendMessageToChannel(
    channelType,
    channel.channelAccessToken,
    contact.contactExternalId,
    content
  );

  if (!success) throw new Error("Failed to send to platform");

  // Insert AI message to DB
  const { data: message } = await supabase
    .from("omMessages")
    .insert({
      messageConversationId: conversationId,
      messageSenderType: "agent",
      messageSenderId: "ai-agent",
      messageContent: content,
      messageType: "text",
      messageExternalId: externalId,
      messageIsAi: true,
    })
    .select()
    .single();

  // Update conversation
  await supabase
    .from("omConversations")
    .update({
      conversationLastMessageAt: new Date().toISOString(),
      conversationLastMessagePreview: content.slice(0, 100),
    })
    .eq("conversationId", conversationId);

  return message;
}
