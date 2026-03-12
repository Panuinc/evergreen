import {
  getServiceSupabase,
  verifyFacebookSignature,
} from "@/app/api/_lib/webhookAuth";
import { checkRateLimit } from "@/app/api/_lib/rateLimit";
import { downloadFacebookImage, downloadFacebookFile } from "@/lib/omnichannel/imageStorage";

const MAX_MESSAGE_LENGTH = 5000;

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
  const rl = checkRateLimit(request, "webhook-facebook", { maxRequests: 120, windowMs: 60_000 });
  if (rl) return rl;

  const rawBody = await request.text();

  if (!rawBody || rawBody.length > 1_000_000) {
    return Response.json({ error: "Invalid payload" }, { status: 400 });
  }

  const signature = request.headers.get("x-hub-signature-256");
  if (process.env.FACEBOOK_APP_SECRET && !verifyFacebookSignature(rawBody, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  if (body.object === "page") {
    for (const entry of (body.entry || []).slice(0, 10)) {
      for (const event of (entry.messaging || []).slice(0, 10)) {
        if (event.message) {
          try {
            await handleMessage(supabase, event);
          } catch (err) {
            console.error("[Facebook Webhook] Error:", err.message);
          }
        }
      }
    }
  }

  return Response.json({ status: "ok" });
}

async function handleMessage(supabase, event) {
  const senderId = event.sender?.id;
  if (!senderId || typeof senderId !== "string" || senderId.length > 100) return;

  const messageText = (event.message.text || "").slice(0, MAX_MESSAGE_LENGTH);
  const attachments = event.message.attachments || [];
  const hasImage = attachments.some((a) => a.type === "image");
  const hasFile = attachments.some((a) => a.type === "file" || a.type === "video" || a.type === "audio");
  const messageType = hasImage ? "image" : hasFile ? "file" : "text";
  const externalId = event.message.mid;
  if (!externalId) return;

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

  let fileUrl = null;
  let fileName = null;
  if (attachments.length > 0) {
    const imgAttachment = attachments.find((a) => a.type === "image");
    const fileAttachment = attachments.find((a) => a.type === "file" || a.type === "video" || a.type === "audio");

    if (imgAttachment?.payload?.url) {
      try {
        fileUrl = await downloadFacebookImage(supabase, imgAttachment.payload.url, externalId);
      } catch (err) {
        console.error("[Facebook Webhook] Failed to download image:", err.message);
      }
    } else if (fileAttachment?.payload?.url) {
      try {
        fileName = fileAttachment.payload.name || `file-${externalId}`;
        fileUrl = await downloadFacebookFile(supabase, fileAttachment.payload.url, externalId);
      } catch (err) {
        console.error("[Facebook Webhook] Failed to download file:", err.message);
      }
    }
  }

  await supabase.from("omMessage").insert({
    omMessageConversationId: conversation.omConversationId,
    omMessageSenderType: "customer",
    omMessageSenderId: senderId,
    omMessageContent: fileName || fileUrl || messageText || "[file]",
    omMessageType: messageType,
    omMessageExternalId: externalId,
    omMessageMetadata: event.message,
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
    console.error("[Facebook Webhook] Failed to trigger AI reply:", err.message);
  });
}
