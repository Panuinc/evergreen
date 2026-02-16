import { supabase } from "@/lib/supabase/client";

const BUCKET = "tms";

export async function uploadFile(folder, file) {
  const fileName = `${folder}/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function uploadFiles(folder, files) {
  return Promise.all(Array.from(files).map((f) => uploadFile(folder, f)));
}

export async function deleteFile(publicUrl) {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${BUCKET}/`);
    if (pathParts.length < 2) return;
    await supabase.storage.from(BUCKET).remove([pathParts[1]]);
  } catch {
    // Silent fail - file may already be deleted
  }
}
