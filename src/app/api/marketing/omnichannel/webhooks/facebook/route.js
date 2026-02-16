import {
  getServiceSupabase,
  verifyFacebookSignature,
} from "@/app/api/_lib/webhookAuth";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return Response.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  if (process.env.FACEBOOK_APP_SECRET && !verifyFacebookSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  const body = JSON.parse(rawBody);
  const supabase = getServiceSupabase();

  if (body.object === "page") {
    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        if (event.message) {
          await handleMessage(supabase, event);
        }
      }
    }
  }

  return Response.json({ status: "ok" });
}

async function handleMessage(supabase, event) {
  const senderId = event.sender.id;
  const messageText = event.message.text || "";
  const messageType = event.message.attachments ? "image" : "text";
  const externalId = event.message.mid;

  // Upsert contact
  const { data: contact } = await supabase
    .from("omContacts")
    .upsert(
      {
        contactChannelType: "facebook",
        contactExternalId: senderId,
        contactDisplayName: senderId,
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
    .eq("conversationChannelType", "facebook")
    .neq("conversationStatus", "closed")
    .order("conversationCreatedAt", { ascending: false })
    .limit(1)
    .single();

  if (!conversation) {
    const { data: newConv } = await supabase
      .from("omConversations")
      .insert({
        conversationContactId: contact.contactId,
        conversationChannelType: "facebook",
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
    messageSenderId: senderId,
    messageContent: messageText,
    messageType: messageType,
    messageExternalId: externalId,
    messageMetadata: event.message,
  });
}
