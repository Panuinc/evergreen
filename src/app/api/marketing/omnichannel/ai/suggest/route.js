import { withAuth } from "@/app/api/_lib/auth";
import { generateAiReply } from "@/lib/omnichannel/aiAgent";

export const maxDuration = 60;

export async function POST(request) {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const { conversationId } = await request.json();
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
