const BUCKET = "omnichannel";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
  "text/csv": "csv",
};

function getExtFromContentType(contentType, fallback = "bin") {
  for (const [mime, ext] of Object.entries(MIME_TO_EXT)) {
    if (contentType.includes(mime)) return ext;
  }
  return fallback;
}

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
  return downloadLineContent(supabase, lineMessageId, channelAccessToken, true);
}

export async function downloadLineFile(supabase, lineMessageId, channelAccessToken, fileName) {
  return downloadLineContent(supabase, lineMessageId, channelAccessToken, false, fileName);
}

async function downloadLineContent(supabase, lineMessageId, channelAccessToken, imageOnly = true, fileName = null) {
  const res = await fetch(
    `https://api-data.line.me/v2/bot/message/${encodeURIComponent(lineMessageId)}/content`,
    {
      headers: { Authorization: `Bearer ${channelAccessToken}` },
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!res.ok) throw new Error(`LINE content API error: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_FILE_SIZE) throw new Error("File too large");

  const contentType = res.headers.get("content-type") || "application/octet-stream";

  if (imageOnly && !contentType.startsWith("image/")) {
    throw new Error("Not an image");
  }

  const ext = getExtFromContentType(contentType, fileName ? fileName.split(".").pop() : "bin");
  const path = `messages/${lineMessageId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function downloadFacebookImage(supabase, imageUrl, messageId) {
  return downloadFacebookAttachment(supabase, imageUrl, messageId, true);
}

export async function downloadFacebookFile(supabase, fileUrl, messageId) {
  return downloadFacebookAttachment(supabase, fileUrl, messageId, false);
}

async function downloadFacebookAttachment(supabase, url, messageId, imageOnly = true) {
  if (!isAllowedUrl(url)) {
    throw new Error("Invalid URL");
  }

  const res = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Facebook download error: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > MAX_FILE_SIZE) throw new Error("File too large");

  const contentType = res.headers.get("content-type") || "application/octet-stream";

  if (imageOnly && !contentType.startsWith("image/")) {
    throw new Error("Not an image");
  }

  const ext = getExtFromContentType(contentType);
  const path = `messages/${messageId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
