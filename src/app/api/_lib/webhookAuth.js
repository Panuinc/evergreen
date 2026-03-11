import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function verifyFacebookSignature(body, signature) {
  if (!signature || !process.env.FACEBOOK_APP_SECRET) return false;
  const parts = signature.split("=");
  if (parts.length !== 2) return false;
  const signatureHash = parts[1];
  const expectedHash = crypto
    .createHmac("sha256", process.env.FACEBOOK_APP_SECRET)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signatureHash, "hex"),
    Buffer.from(expectedHash, "hex")
  );
}

export function verifyLineSignature(body, signature) {
  if (!signature || !process.env.LINE_CHANNEL_SECRET) return false;
  const expectedHash = crypto
    .createHmac("sha256", process.env.LINE_CHANNEL_SECRET)
    .update(body)
    .digest("base64");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedHash)
    );
  } catch {
    return false;
  }
}

export function verifyInternalSecret(request) {
  const provided = request.headers.get("x-internal-secret") || "";
  const expected = process.env.INTERNAL_API_SECRET || "";
  if (!expected || !provided) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(provided),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}
