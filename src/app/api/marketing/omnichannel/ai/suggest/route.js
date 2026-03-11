import { withAuth } from "@/app/api/_lib/auth";
import { checkRateLimit } from "@/app/api/_lib/rateLimit";
import { generateAiReply } from "@/lib/omnichannel/aiAgent";

export const maxDuration = 60;

export async function POST(request) {
  const rl = checkRateLimit(request, "ai-suggest", { maxRequests: 15, windowMs: 60_000 });
  if (rl) return rl;

  const auth = await withAuth();
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { conversationId } = body;
  if (!conversationId) {
    return Response.json({ error: "conversationId required" }, { status: 400 });
  }

  try {
    console.log("[AI Suggest] Generating reply for:", conversationId);
    const suggestion = await generateAiReply(conversationId, auth.supabase);
    console.log("[AI Suggest] Done:", suggestion?.slice(0, 50));
    return Response.json({ suggestion });
  } catch (error) {
    console.error("[AI Suggest] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
