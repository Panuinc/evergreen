import {
  getServiceSupabase,
  verifyLineSignature,
} from "@/app/api/_lib/webhookAuth";
import { downloadLineImage } from "@/lib/omnichannel/imageStorage";

export const maxDuration = 30;

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (process.env.LINE_CHANNEL_SECRET && !verifyLineSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  const body = JSON.parse(rawBody);
  const events = body.events || [];

  // LINE verification sends empty events — return 200 immediately
  if (events.length === 0) {
    return Response.json({ status: "ok" });
  }

  const supabase = getServiceSupabase();

  // Process all events sequentially — LINE allows up to 30 seconds
  for (const event of events) {
    if (event.type === "message") {
      try {
        await handleMessage(supabase, event);
      } catch (err) {
        console.error("[LINE Webhook] Error:", err.message);
      }
    }
  }

  return Response.json({ status: "ok" });
}

// Cache profile per userId to avoid repeated API calls
const profileCache = new Map();

async function getLineProfile(supabase, userId) {
  if (profileCache.has(userId)) return profileCache.get(userId);

  const { data: channel } = await supabase
    .from("omChannel")
    .select("omChannelAccessToken")
    .eq("omChannelType", "line")
    .eq("omChannelStatus", "active")
    .single();

  if (!channel?.omChannelAccessToken) return null;

  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${channel.omChannelAccessToken}` },
    });
    if (res.ok) {
      const profile = await res.json();
      profileCache.set(userId, profile);
      // Clear cache after 5 minutes
      setTimeout(() => profileCache.delete(userId), 5 * 60 * 1000);
      return profile;
    }
  } catch (err) {
    console.error("[LINE Webhook] Failed to fetch profile:", err.message);
  }
  return null;
}

async function handleMessage(supabase, event) {
  const userId = event.source.userId;
  const message = event.message;
  const messageText = message.type === "text" ? message.text : `[${message.type}]`;
  const messageType = message.type === "text" ? "text" : message.type === "sticker" ? "sticker" : "image";

  // Check for duplicate message (LINE may redeliver)
  const { data: existing } = await supabase
    .from("omMessage")
    .select("omMessageId")
    .eq("omMessageExternalId", message.id)
    .limit(1)
    .single();

  if (existing) return; // Already processed

  // Fetch LINE profile for display name and avatar
  const profile = await getLineProfile(supabase, userId);

  // Upsert contact
  const { data: contact } = await supabase
    .from("omContact")
    .upsert(
      {
        omContactChannelType: "line",
        omContactExternalId: userId,
        omContactDisplayName: profile?.displayName || userId,
        omContactAvatarUrl: profile?.pictureUrl || null,
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
    .eq("omConversationChannelType", "line")
    .neq("omConversationStatus", "closed")
    .order("omConversationCreatedAt", { ascending: false })
    .limit(1)
    .single();

  if (!conversation) {
    const { data: newConv } = await supabase
      .from("omConversation")
      .insert({
        omConversationContactId: contact.omContactId,
        omConversationChannelType: "line",
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
  if (message.type === "image") {
    try {
      const { data: channel } = await supabase
        .from("omChannel")
        .select("omChannelAccessToken")
        .eq("omChannelType", "line")
        .eq("omChannelStatus", "active")
        .single();
      if (channel?.omChannelAccessToken) {
        imageUrl = await downloadLineImage(supabase, message.id, channel.omChannelAccessToken);
      }
    } catch (err) {
      console.error("[LINE Webhook] Failed to download image:", err.message);
    }
  }

  // Insert message
  await supabase.from("omMessage").insert({
    omMessageConversationId: conversation.omConversationId,
    omMessageSenderType: "customer",
    omMessageSenderId: userId,
    omMessageContent: imageUrl || messageText,
    omMessageType: messageType,
    omMessageExternalId: message.id,
    omMessageMetadata: message,
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
    console.error("[LINE Webhook] Failed to trigger AI reply:", err.message);
  });
}
