import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const goBase = process.env.GO_API_URL || "http://localhost:8080";

export async function GET(request: NextRequest) {
  // Accept token from Authorization header (client-side) OR Supabase cookie (SSR)
  let token = request.headers.get("Authorization") ?? "";
  if (!token) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) token = `Bearer ${session.access_token}`;
  }

  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const search = request.nextUrl.search;
  const upstream = await fetch(`${goBase}/api/sync/bc${search}`, {
    headers: { Authorization: token },
  });

  if (!upstream.ok) {
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Stream SSE directly from Go → browser
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
