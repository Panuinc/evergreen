import { withAuth } from "@/app/api/_lib/auth";
import { bcApiGet } from "@/lib/bcClient";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;

  try {
    const data = await bcApiGet("trialBalances", {}, { timeout: 30_000 });
    return Response.json(data);
  } catch (e) {
    console.error("[trialBalance] error:", e.message);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
