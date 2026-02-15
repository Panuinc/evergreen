import { withAuth } from "@/app/api/_lib/auth";
import { bcGet } from "@/lib/bcClient";

async function checkSupabase(supabase) {
  const start = Date.now();
  try {
    const { error } = await supabase.from("roles").select("count", { count: "exact", head: true });
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
    await bcGet("/companies", { $top: "1" });
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
    });
    const latency = Date.now() - start;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { status: "connected", latency, error: null };
  } catch (err) {
    return { status: "error", latency: Date.now() - start, error: err.message };
  }
}

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  const [supabase, bc, openrouter] = await Promise.all([
    checkSupabase(auth.supabase),
    checkBc(),
    checkOpenRouter(),
  ]);

  return Response.json({ supabase, bc, openrouter });
}
