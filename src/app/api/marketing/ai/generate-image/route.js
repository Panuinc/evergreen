import { withAuth } from "@/app/api/_lib/auth";
import { checkRateLimit } from "@/app/api/_lib/rateLimit";
import { generateImage, getGenerationHistory } from "@/lib/marketing/imageGenerator";

export const maxDuration = 120;

export async function POST(request) {
  const rl = checkRateLimit(request, "ai-generate-image", {
    maxRequests: 10,
    windowMs: 60_000,
  });
  if (rl) return rl;

  const auth = await withAuth();
  if (auth.error) return auth.error;

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data" }, { status: 400 });
  }

  const imageFile = formData.get("image");
  const prompt = formData.get("prompt");
  const size = formData.get("size") || "1024x1024";

  if (!imageFile || !(imageFile instanceof Blob)) {
    return Response.json({ error: "image file is required" }, { status: 400 });
  }
  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    return Response.json({ error: "prompt is required" }, { status: 400 });
  }

  const validSizes = ["1024x1024", "1536x1024", "1024x1536", "2016x864"];
  if (!validSizes.includes(size)) {
    return Response.json(
      { error: `Invalid size. Must be one of: ${validSizes.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    const result = await generateImage({
      imageBuffer,
      fileName: imageFile.name || "image.png",
      prompt,
      size,
      userId: auth.session.user.id,
      supabase: auth.supabase,
    });

    return Response.json(result);
  } catch (error) {
    console.error("[ImageGen API] Error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const rl = checkRateLimit(request, "ai-generate-image-history", {
    maxRequests: 30,
    windowMs: 60_000,
  });
  if (rl) return rl;

  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

    const history = await getGenerationHistory(
      auth.supabase,
      auth.session.user.id,
      auth.isSuperAdmin,
      limit
    );

    return Response.json(history);
  } catch (error) {
    console.error("[ImageGen API] History error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
