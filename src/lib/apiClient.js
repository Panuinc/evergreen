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

async function apiRequest(url, options = {}) {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export function get(url) {
  return apiRequest(url);
}

export function post(url, body) {
  return apiRequest(url, { method: "POST", body: JSON.stringify(body) });
}

export function put(url, body) {
  return apiRequest(url, { method: "PUT", body: JSON.stringify(body) });
}

export function patch(url, body) {
  return apiRequest(url, { method: "PATCH", body: JSON.stringify(body) });
}

export function del(url) {
  return apiRequest(url, { method: "DELETE" });
}

// Raw fetch with auth headers (for file downloads, SSE streams, FormData uploads)
export async function authFetch(url, options = {}) {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
}
