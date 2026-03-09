const BUCKET = "omnichannel";


export async function downloadLineImage(supabase, lineMessageId, channelAccessToken) {
  const res = await fetch(
    `https://api-data.line.me/v2/bot/message/${lineMessageId}/content`,
    { headers: { Authorization: `Bearer ${channelAccessToken}` } }
  );
  if (!res.ok) throw new Error(`LINE content API error: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
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
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Facebook image download error: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : "jpg";
  const path = `messages/${messageId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
