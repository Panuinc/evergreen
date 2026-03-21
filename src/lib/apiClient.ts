import { supabase } from "@/lib/supabase/client";

async function getAuthHeaders() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    // No session available
  }
  return {};
}

async function apiRequest<T = unknown>(url: string, options: { method?: string; body?: string; headers?: Record<string, string> } = {}, retry = true): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  // Session not ready yet — wait and retry once
  if (res.status === 401 && retry) {
    await new Promise((r) => setTimeout(r, 500));
    return apiRequest<T>(url, options, false);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export function get<T = unknown>(url: string): Promise<T> {
  return apiRequest<T>(url);
}

export function post<T = unknown>(url: string, body?: unknown): Promise<T> {
  return apiRequest<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export function put<T = unknown>(url: string, body?: unknown): Promise<T> {
  return apiRequest<T>(url, { method: "PUT", body: JSON.stringify(body) });
}

export function patch<T = unknown>(url: string, body?: unknown): Promise<T> {
  return apiRequest<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}

export function del<T = unknown>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: "DELETE" });
}

// Raw fetch with auth headers (for file downloads, SSE streams, FormData uploads)
export async function authFetch(url: string, options: { headers?: Record<string, string>; [key: string]: unknown } = {}) {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}
