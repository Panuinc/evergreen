import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function verifyFacebookSignature(body, signature) {
  if (!signature) return false;
  const elements = signature.split("=");
  const signatureHash = elements[1];
  const expectedHash = crypto
    .createHmac("sha256", process.env.FACEBOOK_APP_SECRET || "")
    .update(body)
    .digest("hex");
  return signatureHash === expectedHash;
}

export function verifyLineSignature(body, signature) {
  if (!signature) return false;
  const expectedHash = crypto
    .createHmac("sha256", process.env.LINE_CHANNEL_SECRET || "")
    .update(body)
    .digest("base64");
  return signature === expectedHash;
}
