import {
  getServiceSupabase,
  verifyFacebookSignature,
} from "@/app/api/_lib/webhookAuth";
import { downloadFacebookImage } from "@/lib/omnichannel/imageStorage";

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
    .from("omContact")
    .upsert(
      {
        omContactChannelType: "facebook",
        omContactExternalId: senderId,
        omContactDisplayName: senderId,
      },
      { onConflict: "omContactChannelType,omContactExternalId" }
    )
    .select()
    .single();

  if (!contact) return;

  // Find or create conversation
  let { data: conversation } = await supabase
    .from("omConversation")
    .select()
    .eq("omConversationContactId", contact.omContactId)
    .eq("omConversationChannelType", "facebook")
    .neq("omConversationStatus", "closed")
    .order("omConversationCreatedAt", { ascending: false })
    .limit(1)
    .single();

  if (!conversation) {
    const { data: newConv } = await supabase
      .from("omConversation")
      .insert({
        omConversationContactId: contact.omContactId,
        omConversationChannelType: "facebook",
        omConversationStatus: "open",
        omConversationLastMessageAt: new Date().toISOString(),
        omConversationLastMessagePreview: messageText.slice(0, 100),
        omConversationUnreadCount: 1,
        omConversationAiAutoReply: true,
      })
      .select()
      .single();
    conversation = newConv;
  } else {
    await supabase
      .from("omConversation")
      .update({
        omConversationLastMessageAt: new Date().toISOString(),
        omConversationLastMessagePreview: messageText.slice(0, 100),
        omConversationUnreadCount: (conversation.omConversationUnreadCount || 0) + 1,
        omConversationStatus: conversation.omConversationStatus === "closed" ? "open" : conversation.omConversationStatus,
      })
      .eq("omConversationId", conversation.omConversationId);
  }

  if (!conversation) return;

  // Download image if applicable
  let imageUrl = null;
  if (event.message.attachments) {
    const imgAttachment = event.message.attachments.find((a) => a.type === "image");
    if (imgAttachment?.payload?.url) {
      try {
        imageUrl = await downloadFacebookImage(supabase, imgAttachment.payload.url, externalId);
      } catch (err) {
        console.error("[Facebook Webhook] Failed to download image:", err.message);
      }
    }
  }

  // Insert message
  await supabase.from("omMessage").insert({
    omMessageConversationId: conversation.omConversationId,
    omMessageSenderType: "customer",
    omMessageSenderId: senderId,
    omMessageContent: imageUrl || messageText || "[image]",
    omMessageType: messageType,
    omMessageExternalId: externalId,
    omMessageMetadata: event.message,
    omMessageImageUrl: imageUrl,
  });

  // Trigger AI auto-reply if enabled
  if (conversation.omConversationAiAutoReply) {
    triggerAiReply(conversation.omConversationId);
  }
}

function triggerAiReply(conversationId) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  fetch(`${baseUrl}/api/marketing/omnichannel/ai/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-secret": process.env.INTERNAL_API_SECRET,
    },
    body: JSON.stringify({ conversationId }),
  }).catch((err) => {
    console.error("[Facebook Webhook] Failed to trigger AI reply:", err.message);
  });
}
