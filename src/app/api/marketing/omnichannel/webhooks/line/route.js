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
  const supabase = getServiceSupabase();

  // Process all events sequentially — LINE allows up to 30 seconds
  for (const event of body.events || []) {
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
    .from("omChannels")
    .select("channelAccessToken")
    .eq("channelType", "line")
    .eq("channelStatus", "active")
    .single();

  if (!channel?.channelAccessToken) return null;

  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${channel.channelAccessToken}` },
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
    .from("omMessages")
    .select("messageId")
    .eq("messageExternalId", message.id)
    .limit(1)
    .single();

  if (existing) return; // Already processed

  // Fetch LINE profile for display name and avatar
  const profile = await getLineProfile(supabase, userId);

  // Upsert contact
  const { data: contact } = await supabase
    .from("omContacts")
    .upsert(
      {
        contactChannelType: "line",
        contactExternalId: userId,
        contactDisplayName: profile?.displayName || userId,
        contactAvatarUrl: profile?.pictureUrl || null,
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
        conversationAiAutoReply: true,
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

  // Download image if applicable
  let imageUrl = null;
  if (message.type === "image") {
    try {
      const { data: channel } = await supabase
        .from("omChannels")
        .select("channelAccessToken")
        .eq("channelType", "line")
        .eq("channelStatus", "active")
        .single();
      if (channel?.channelAccessToken) {
        imageUrl = await downloadLineImage(supabase, message.id, channel.channelAccessToken);
      }
    } catch (err) {
      console.error("[LINE Webhook] Failed to download image:", err.message);
    }
  }

  // Insert message
  await supabase.from("omMessages").insert({
    messageConversationId: conversation.conversationId,
    messageSenderType: "customer",
    messageSenderId: userId,
    messageContent: imageUrl || messageText,
    messageType: messageType,
    messageExternalId: message.id,
    messageMetadata: message,
    messageImageUrl: imageUrl,
  });

  // Trigger AI auto-reply if enabled
  if (conversation.conversationAiAutoReply) {
    triggerAiReply(conversation.conversationId);
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
