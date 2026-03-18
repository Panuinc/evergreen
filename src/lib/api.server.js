import { createClient } from "@/lib/supabase/server";

const API_BASE = process.env.GO_API_URL || "http://localhost:8080";

/**
 * Server-side fetch helper — reads auth token from Supabase session cookie
 * Use this in Server Components (page.jsx, layout.jsx)
 */
export async function api(path) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

/**
 * Server-side mutate helper (POST/PUT/PATCH/DELETE)
 * For Server Actions ("use server")
 */
export async function apiMutate(path, method = "POST", body = null) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}
