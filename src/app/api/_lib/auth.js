import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

export async function withAuth() {
  // Try cookie-based session first (web app)
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (!error && session) {
    return { supabase, session };
  }

  // Fall back to Bearer token (mobile app)
  const headersList = await headers();
  const authHeader = headersList.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (token) {
    const supabaseWithToken = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseWithToken.auth.getUser(token);

    if (!userError && user) {
      return { supabase: supabaseWithToken, session: { user } };
    }
  }

  return {
    error: Response.json({ error: "Unauthorized" }, { status: 401 }),
  };
}
