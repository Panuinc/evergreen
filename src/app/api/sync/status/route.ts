import { createClient } from "@/lib/supabase/server";

const goBase = process.env.GO_API_URL || "http://localhost:8080";

export async function GET(request: Request) {
  let token = (request as Request & { headers: Headers }).headers.get("Authorization") ?? "";
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

  const upstream = await fetch(`${goBase}/api/sync/status`, {
    headers: { Authorization: token },
    cache: "no-store",
  });

  const data = await upstream.json();
  return Response.json(data, { status: upstream.status });
}
