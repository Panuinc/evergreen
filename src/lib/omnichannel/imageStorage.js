const BUCKET = "omnichannel";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

function isAllowedUrl(url) {
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return false;
    const hostname = parsed.hostname.toLowerCase();
    // Block internal/private IPs
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function downloadLineImage(supabase, lineMessageId, channelAccessToken) {
  const res = await fetch(
    `https://api-data.line.me/v2/bot/message/${encodeURIComponent(lineMessageId)}/content`,
    {
      headers: { Authorization: `Bearer ${channelAccessToken}` },
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!res.ok) throw new Error(`LINE content API error: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_IMAGE_SIZE) throw new Error("Image too large");

  const contentType = res.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) throw new Error("Not an image");

  const ext = contentType.includes("png") ? "png" : "jpg";
  const path = `messages/${lineMessageId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function downloadFacebookImage(supabase, imageUrl, messageId) {
  if (!isAllowedUrl(imageUrl)) {
    throw new Error("Invalid image URL");
  }

  const res = await fetch(imageUrl, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Facebook image download error: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_IMAGE_SIZE) throw new Error("Image too large");

  const contentType = res.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) throw new Error("Not an image");

  const ext = contentType.includes("png") ? "png" : "jpg";
  const path = `messages/${messageId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
