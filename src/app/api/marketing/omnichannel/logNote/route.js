import { withAuth } from "@/app/api/_lib/auth";
import { checkRateLimit } from "@/app/api/_lib/rateLimit";

const MAX_MESSAGE_LENGTH = 5000;

export async function POST(request) {
  const rl = checkRateLimit(request, "om-log-note", { maxRequests: 30, windowMs: 60_000 });
  if (rl) return rl;

  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { conversationId, content } = body;

  if (!conversationId || typeof conversationId !== "string") {
    return Response.json({ error: "conversationId is required" }, { status: 400 });
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  const sanitizedContent = content.trim().slice(0, MAX_MESSAGE_LENGTH);

  const { data: conversation, error: convError } = await supabase
    .from("omConversation")
    .select("omConversationId")
    .eq("omConversationId", conversationId)
    .single();

  if (convError || !conversation) {
    return Response.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { data: message, error: msgError } = await supabase
    .from("omMessage")
    .insert({
      omMessageConversationId: conversationId,
      omMessageSenderType: "agent",
      omMessageSenderId: session.user.id,
      omMessageContent: sanitizedContent,
      omMessageType: "text",
    })
    .select()
    .single();

  if (msgError) {
    return Response.json({ error: "Failed to save message" }, { status: 500 });
  }

  await supabase
    .from("omConversation")
    .update({
      omConversationLastMessageAt: new Date().toISOString(),
      omConversationLastMessagePreview: sanitizedContent.slice(0, 100),
    })
    .eq("omConversationId", conversationId);

  return Response.json(message, { status: 201 });
}
