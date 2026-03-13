import {
  getServiceSupabase,
  verifyLineSignature,
} from "@/app/api/_lib/webhookAuth";
import { checkRateLimit } from "@/app/api/_lib/rateLimit";
import { downloadLineImage, downloadLineFile } from "@/lib/omnichannel/imageStorage";

export const maxDuration = 30;

const MAX_MESSAGE_LENGTH = 5000;

export async function POST(request) {
  const rl = checkRateLimit(request, "webhook-line", { maxRequests: 120, windowMs: 60_000 });
  if (rl) return rl;

  const rawBody = await request.text();

  if (!rawBody || rawBody.length > 1_000_000) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const signature = request.headers.get("x-line-signature");
  if (!verifyLineSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events = body.events || [];
  if (!Array.isArray(events) || events.length === 0) {
    return Response.json({ status: "ok" });
  }

  const supabase = getServiceSupabase();

  for (const event of events.slice(0, 10)) {
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
    const res = await fetch(`https://api.line.me/v2/bot/profile/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${channel.omChannelAccessToken}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      const profile = await res.json();
      profileCache.set(userId, profile);
      setTimeout(() => profileCache.delete(userId), 5 * 60 * 1000);
      return profile;
    }
  } catch (err) {
    console.error("[LINE Webhook] Failed to fetch profile:", err.message);
  }
  return null;
}

async function handleMessage(supabase, event) {
  const userId = event.source?.userId;
  if (!userId || typeof userId !== "string" || userId.length > 100) return;

  const message = event.message;
  if (!message?.id) return;

  const messageText = message.type === "text"
    ? (message.text || "").slice(0, MAX_MESSAGE_LENGTH)
    : `[${message.type}]`;
  const messageType = message.type === "text"
    ? "text"
    : message.type === "sticker"
      ? "sticker"
      : message.type === "file" || message.type === "video" || message.type === "audio"
        ? "file"
        : "image";

  const { data: existing } = await supabase
    .from("omMessage")
    .select("omMessageId")
    .eq("omMessageExternalId", message.id)
    .limit(1)
    .single();

  if (existing) return;

  const profile = await getLineProfile(supabase, userId);

  const displayName = (profile?.displayName || userId).slice(0, 200);
  const avatarUrl = profile?.pictureUrl?.startsWith("https://") ? profile.pictureUrl : null;

  const { data: contact } = await supabase
    .from("omContact")
    .upsert(
      {
        omContactChannelType: "line",
        omContactExternalId: userId,
        omContactDisplayName: displayName,
        omContactAvatarUrl: avatarUrl,
      },
      { onConflict: "omContactChannelType,omContactExternalId" }
    )
    .select()
    .single();

  if (!contact) return;

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
        omConversationAiAutoReply: false,
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

  let fileUrl = null;
  let fileName = null;
  if (message.type === "image" || message.type === "file" || message.type === "video" || message.type === "audio") {
    try {
      const { data: channel } = await supabase
        .from("omChannel")
        .select("omChannelAccessToken")
        .eq("omChannelType", "line")
        .eq("omChannelStatus", "active")
        .single();
      if (channel?.omChannelAccessToken) {
        if (message.type === "image") {
          fileUrl = await downloadLineImage(supabase, message.id, channel.omChannelAccessToken);
        } else {
          fileName = message.fileName || `${message.type}-${message.id}`;
          fileUrl = await downloadLineFile(supabase, message.id, channel.omChannelAccessToken, fileName);
        }
      }
    } catch (err) {
      console.error("[LINE Webhook] Failed to download content:", err.message);
    }
  }

  await supabase.from("omMessage").insert({
    omMessageConversationId: conversation.omConversationId,
    omMessageSenderType: "customer",
    omMessageSenderId: userId,
    omMessageContent: fileName || fileUrl || messageText,
    omMessageType: messageType,
    omMessageExternalId: message.id,
    omMessageMetadata: message,
    omMessageImageUrl: fileUrl,
  });

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
    signal: AbortSignal.timeout(55_000),
  }).catch((err) => {
    console.error("[LINE Webhook] Failed to trigger AI reply:", err.message);
  });
}
