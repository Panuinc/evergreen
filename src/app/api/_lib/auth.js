import { createClient } from "@/lib/supabase/server";
import { createClient as createBrowserClient } from "@supabase/supabase-js";
import { headers } from "next/headers";

async function checkUserAccess(supabase, userId) {
  const [rolesResult, profileResult] = await Promise.all([
    supabase
      .from("rbacUserRole")
      .select("rbacRole(rbacRoleIsSuperadmin)")
      .eq("rbacUserRoleUserId", userId)
      .eq("isActive", true),
    supabase
      .from("rbacUserProfile")
      .select("isActive")
      .eq("rbacUserProfileId", userId)
      .single(),
  ]);

  const isActive = profileResult.data ? profileResult.data.isActive !== false : true;
  const isSuperAdmin =
    rolesResult.data?.some((r) => r.rbacRole?.rbacRoleIsSuperadmin === true) || false;

  return { isSuperAdmin, isActive };
}

export async function withAuth() {

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    const { isSuperAdmin, isActive } = await checkUserAccess(supabase, user.id);
    if (!isActive) {
      return { error: Response.json({ error: "บัญชีถูกปิดใช้งาน" }, { status: 403 }) };
    }
    return { supabase, session: { user }, isSuperAdmin };
  }


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
      const { isSuperAdmin, isActive } = await checkUserAccess(supabaseWithToken, user.id);
      if (!isActive) {
        return { error: Response.json({ error: "บัญชีถูกปิดใช้งาน" }, { status: 403 }) };
      }
      return { supabase: supabaseWithToken, session: { user }, isSuperAdmin };
    }
  }

  return {
    error: Response.json({ error: "Unauthorized" }, { status: 401 }),
  };
}
