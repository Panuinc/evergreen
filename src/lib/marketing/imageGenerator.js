import https from "node:https";
import sharp from "sharp";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const BUCKET = "marketing";
const MAX_INPUT_SIZE = 20 * 1024 * 1024; // 20MB

// 4K target resolutions per aspect ratio
const UPSCALE_TARGETS = {
  "1024x1024": { width: 4096, height: 4096 },
  "1536x1024": { width: 4096, height: 2732 },
  "1024x1536": { width: 2732, height: 4096 },
  "2016x864": { width: 4096, height: 1756 },
};

/**
 * Make HTTPS POST request using node:https directly.
 * Uses agent:false to prevent connection pooling (fixes ECONNRESET).
 */
function httpsPost(url, headers, body, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = typeof body === "string" ? body : JSON.stringify(body);

    const req = https.request(
      {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: "POST",
        agent: false,
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
          Connection: "close",
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          if (res.statusCode >= 400) {
            reject(new Error(`OpenRouter API error: ${res.statusCode} ${text}`));
          } else {
            try {
              resolve(JSON.parse(text));
            } catch {
              reject(new Error(`Invalid JSON response: ${text.slice(0, 200)}`));
            }
          }
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.on("error", (err) => reject(new Error(`Request failed: ${err.message}`)));
    req.write(postData);
    req.end();
  });
}

/**
 * Call httpsPost with retry logic for transient errors (ECONNRESET, 500).
 */
async function httpsPostWithRetry(url, headers, body, { maxRetries = 3, timeoutMs = 120_000 } = {}) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await httpsPost(url, headers, body, timeoutMs);
    } catch (err) {
      const isRetryable = err.message.includes("ECONNRESET") || err.message.includes("500");
      if (!isRetryable || attempt === maxRetries) throw err;
      const delay = attempt * 2000;
      console.log(`[ImageGen] Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/**
 * Generate an edited image using Gemini via OpenRouter and save to Supabase.
 */
export async function generateImage({
  imageBuffer,
  fileName,
  prompt,
  size = "1024x1024",
  userId,
  supabase,
}) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error("Image is required");
  }
  if (imageBuffer.length > MAX_INPUT_SIZE) {
    throw new Error("Image size exceeds 20MB limit");
  }
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt is required");
  }

  // Upload original image to Supabase
  const timestamp = Date.now();
  const ext = getExtension(fileName);
  const originalPath = `generated/${userId}/${timestamp}-original.${ext}`;
  const contentType = ext === "png" ? "image/png" : "image/jpeg";

  const { error: uploadOrigErr } = await supabase.storage
    .from(BUCKET)
    .upload(originalPath, imageBuffer, { contentType, upsert: true });

  if (uploadOrigErr) {
    throw new Error(`Failed to upload original image: ${uploadOrigErr.message}`);
  }

  const { data: origUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(originalPath);

  // Send public URL to Gemini instead of base64 to avoid large payloads
  const imageUrl = origUrlData.publicUrl;

  console.log("[ImageGen] Calling Gemini via OpenRouter, image URL:", imageUrl);

  const aiResult = await httpsPostWithRetry(
    API_URL,
    { Authorization: `Bearer ${apiKey}` },
    {
      model: "google/gemini-3-pro-image-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
            {
              type: "text",
              text: buildPromptWithSize(prompt.trim(), size),
            },
          ],
        },
      ],
    }
  );

  console.log("[ImageGen] Response received, images:", aiResult.choices?.[0]?.message?.images?.length ?? 0);

  // Extract generated image from Gemini multimodal response
  const generatedB64 = extractImageFromResponse(aiResult);
  if (!generatedB64) {
    throw new Error("No image returned from AI model");
  }

  // Upscale to 4K using sharp
  const rawBuffer = Buffer.from(generatedB64, "base64");
  const target = UPSCALE_TARGETS[size] || UPSCALE_TARGETS["1024x1024"];
  console.log("[ImageGen] Upscaling to 4K:", target.width, "x", target.height);
  const generatedBuffer = await sharp(rawBuffer)
    .resize(target.width, target.height, {
      kernel: sharp.kernel.lanczos3,
      fit: "fill",
    })
    .png({ quality: 90 })
    .toBuffer();
  console.log("[ImageGen] Upscaled size:", (generatedBuffer.length / 1024 / 1024).toFixed(1), "MB");

  const generatedPath = `generated/${userId}/${timestamp}-result.png`;

  const { error: uploadGenErr } = await supabase.storage
    .from(BUCKET)
    .upload(generatedPath, generatedBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadGenErr) {
    throw new Error(`Failed to upload generated image: ${uploadGenErr.message}`);
  }

  const { data: genUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(generatedPath);

  // Save record to database
  const { data: record, error: dbErr } = await supabase
    .from("mktGeneratedImage")
    .insert({
      mktGeneratedImagePrompt: prompt.trim(),
      mktGeneratedImageOriginalUrl: origUrlData.publicUrl,
      mktGeneratedImageResultUrl: genUrlData.publicUrl,
      mktGeneratedImageSize: size,
      mktGeneratedImageCreatedBy: userId,
    })
    .select("mktGeneratedImageId")
    .single();

  if (dbErr) {
    console.error("[ImageGen] DB insert error:", dbErr.message);
  }

  return {
    id: record?.mktGeneratedImageId || null,
    originalImageUrl: origUrlData.publicUrl,
    generatedImageUrl: genUrlData.publicUrl,
  };
}

/**
 * Get generation history. Superadmin sees all, normal user sees own only.
 */
export async function getGenerationHistory(supabase, userId, isSuperAdmin, limit = 20) {
  let query = supabase
    .from("mktGeneratedImage")
    .select("*")
    .order("mktGeneratedImageCreatedAt", { ascending: false })
    .limit(limit);

  if (!isSuperAdmin) {
    query = query.eq("mktGeneratedImageCreatedBy", userId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Extract base64 image from Gemini/OpenRouter response.
 * Gemini returns images in message.images[] as { type: "image_url", image_url: { url: "data:..." } }
 */
function extractImageFromResponse(result) {
  const message = result.choices?.[0]?.message;
  if (!message) return null;

  // Primary: Gemini returns images in message.images array
  if (Array.isArray(message.images)) {
    for (const img of message.images) {
      if (img.type === "image_url" && img.image_url?.url) {
        const match = img.image_url.url.match(/^data:image\/\w+;base64,(.+)$/s);
        if (match) return match[1];
      }
    }
  }

  // Fallback: check content array
  const content = message.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "image_url" && part.image_url?.url) {
        const match = part.image_url.url.match(/^data:image\/\w+;base64,(.+)$/s);
        if (match) return match[1];
      }
      if (part.inline_data?.data) return part.inline_data.data;
    }
  }

  // Fallback: content is a string with embedded data URL
  if (typeof content === "string") {
    const match = content.match(/data:image\/\w+;base64,([A-Za-z0-9+/=]+)/);
    if (match) return match[1];
  }

  return null;
}

const SIZE_LABELS = {
  "1024x1024": "1:1 square (1024×1024 pixels)",
  "1536x1024": "3:2 landscape (1536×1024 pixels)",
  "1024x1536": "2:3 portrait (1024×1536 pixels)",
  "2016x864": "21:9 ultra-wide landscape (2016×864 pixels)",
};

function buildPromptWithSize(prompt, size) {
  const sizeLabel = SIZE_LABELS[size];
  if (!sizeLabel || size === "1024x1024") return prompt;
  return `${prompt}\n\nIMPORTANT: The output image MUST be in ${sizeLabel} aspect ratio. Do not generate a square image.`;
}

function getExtension(filename) {
  const ext = (filename || "").split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return ext;
  return "png";
}
