import {
  getServiceSupabase,
  verifyLineSignature,
} from "@/app/api/_lib/webhookAuth";

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (process.env.LINE_CHANNEL_SECRET && !verifyLineSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  const body = JSON.parse(rawBody);
  const supabase = getServiceSupabase();

  for (const event of body.events || []) {
    if (event.type === "message") {
      await handleMessage(supabase, event);
    }
  }

  return Response.json({ status: "ok" });
}

async function handleMessage(supabase, event) {
  const userId = event.source.userId;
  const message = event.message;
  const messageText = message.type === "text" ? message.text : `[${message.type}]`;
  const messageType = message.type === "text" ? "text" : message.type === "sticker" ? "sticker" : "image";

  // Upsert contact
  const { data: contact } = await supabase
    .from("omContacts")
    .upsert(
      {
        contactChannelType: "line",
        contactExternalId: userId,
        contactDisplayName: userId,
      },
      { onConflict: "contactChannelType,contactExternalId" }
    )
    .select()
    .single();

  if (!contact) return;

  // Find or create conversation
  let { data: conversation } = await supabase
    .from("omConversations")
    .select()
    .eq("conversationContactId", contact.contactId)
    .eq("conversationChannelType", "line")
    .neq("conversationStatus", "closed")
    .order("conversationCreatedAt", { ascending: false })
    .limit(1)
    .single();

  if (!conversation) {
    const { data: newConv } = await supabase
      .from("omConversations")
      .insert({
        conversationContactId: contact.contactId,
        conversationChannelType: "line",
        conversationStatus: "open",
        conversationLastMessageAt: new Date().toISOString(),
        conversationLastMessagePreview: messageText.slice(0, 100),
        conversationUnreadCount: 1,
      })
      .select()
      .single();
    conversation = newConv;
  } else {
    await supabase
      .from("omConversations")
      .update({
        conversationLastMessageAt: new Date().toISOString(),
        conversationLastMessagePreview: messageText.slice(0, 100),
        conversationUnreadCount: (conversation.conversationUnreadCount || 0) + 1,
        conversationStatus: conversation.conversationStatus === "closed" ? "open" : conversation.conversationStatus,
      })
      .eq("conversationId", conversation.conversationId);
  }

  if (!conversation) return;

  // Insert message
  await supabase.from("omMessages").insert({
    messageConversationId: conversation.conversationId,
    messageSenderType: "customer",
    messageSenderId: userId,
    messageContent: messageText,
    messageType: messageType,
    messageExternalId: message.id,
    messageMetadata: message,
  });
}
