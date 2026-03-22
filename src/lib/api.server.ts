import { createClient } from "@/lib/supabase/server";

const apiBase = process.env.GO_API_URL || "http://localhost:8080";

/**
 * Server-side fetch helper — reads auth token from Supabase session cookie
 * Use this in Server Components (page.tsx, layout.tsx)
 *
 * @param revalidate - seconds to cache (e.g. 300 for 5 min). Omit for no-store (default).
 *   Use for slow-changing reference data: items, customers, dimension values, etc.
 *   Do NOT use for user-specific or real-time data.
 */
export async function api<T = unknown>(path: string, revalidate?: number): Promise<T | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const nextOptions = revalidate != null ? { next: { revalidate } } : { cache: "no-store" as const };

  const res = await fetch(`${apiBase}${path}`, { headers, ...nextOptions });

  if (!res.ok) {
    return null;
  }

  return res.json() as Promise<T>;
}

/**
 * Server-side mutate helper (POST/PUT/PATCH/DELETE)
 * For Server Actions ("use server")
 */
export async function apiMutate(path: string, method = "POST", body: unknown = null) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const options: { method: string; headers: Record<string, string>; body?: string } = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${apiBase}${path}`, options);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }

  return data;
}
