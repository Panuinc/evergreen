import { withAuth } from "@/app/api/_lib/auth";
import { bcODataGet } from "@/lib/bcClient";

async function checkSupabase(supabase) {
  const start = Date.now();
  try {
    const { error } = await supabase.from("rbacRole").select("count", { count: "exact", head: true });
    const latency = Date.now() - start;
    if (error) throw error;
    return { status: "connected", latency, error: null };
  } catch (err) {
    return { status: "error", latency: Date.now() - start, error: err.message };
  }
}

async function checkBc() {
  const start = Date.now();
  try {
    await bcODataGet("CustomerList", { $top: "1" });
    const latency = Date.now() - start;
    return { status: "connected", latency, error: null };
  } catch (err) {
    return { status: "error", latency: Date.now() - start, error: err.message };
  }
}

async function checkOpenRouter() {
  const start = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    const latency = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { status: "connected", latency, error: null };
  } catch (err) {
    return { status: "error", latency: Date.now() - start, error: err.message };
  }
}

async function checkLine(supabase) {
  const start = Date.now();
  try {
    const { data, error } = await supabase
      .from("omChannel")
      .select("omChannelAccessToken")
      .eq("omChannelType", "line")
      .eq("omChannelStatus", "active")
      .limit(1)
      .single();
    if (error || !data) throw new Error("No active LINE channel configured");

    const res = await fetch("https://api.line.me/v2/bot/info", {
      headers: { Authorization: `Bearer ${data.omChannelAccessToken}` },
      signal: AbortSignal.timeout(8000),
    });
    const latency = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const info = await res.json();
    return { status: "connected", latency, detail: info.displayName || null, error: null };
  } catch (err) {
    return { status: "error", latency: Date.now() - start, error: err.message };
  }
}

async function checkFacebook(supabase) {
  const start = Date.now();
  try {
    const { data, error } = await supabase
      .from("omChannel")
      .select("omChannelAccessToken")
      .eq("omChannelType", "facebook")
      .eq("omChannelStatus", "active")
      .limit(1)
      .single();
    if (error || !data) throw new Error("No active Facebook channel configured");

    const res = await fetch(
      `https://graph.facebook.com/v21.0/me?access_token=${data.omChannelAccessToken}`,
      { signal: AbortSignal.timeout(8000) },
    );
    const latency = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const info = await res.json();
    return { status: "connected", latency, detail: info.name || null, error: null };
  } catch (err) {
    return { status: "error", latency: Date.now() - start, error: err.message };
  }
}

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const [supabase, bc, openrouter, line, facebook] = await Promise.all([
    checkSupabase(auth.supabase),
    checkBc(),
    checkOpenRouter(),
    checkLine(auth.supabase),
    checkFacebook(auth.supabase),
  ]);

  return Response.json({ supabase, bc, openrouter, line, facebook });
}
