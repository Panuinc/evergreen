import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

async function checkSuperAdmin(supabase, userId) {
  const { data: roles } = await supabase
    .from("rbacUserRole")
    .select("rbacRole(rbacRoleIsSuperadmin)")
    .eq("rbacUserRoleUserId", userId)
    .eq("isActive", true);

  return roles?.some((r) => r.rbacRole?.rbacRoleIsSuperadmin === true) || false;
}

export async function withAuth() {
  // Try cookie-based session first (web app)
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    const isSuperAdmin = await checkSuperAdmin(supabase, user.id);
    return { supabase, session: { user }, isSuperAdmin };
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
      const isSuperAdmin = await checkSuperAdmin(supabaseWithToken, user.id);
      return { supabase: supabaseWithToken, session: { user }, isSuperAdmin };
    }
  }

  return {
    error: Response.json({ error: "Unauthorized" }, { status: 401 }),
  };
}
