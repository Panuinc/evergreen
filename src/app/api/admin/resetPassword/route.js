import { createClient } from "@supabase/supabase-js";
import { withAuth } from "@/app/api/_lib/auth";

export async function POST(request) {
  const { supabase, session, error: authError } = await withAuth();
  if (authError) return authError;

  // ตรวจสอบว่า user มี rbac permission (superadmin หรือ rbac:create)
  const { data: permissions } = await supabase.rpc(
    "get_user_permissions",
    { p_user_id: session.user.id },
  );

  const isSuperAdmin = permissions?.some((p) => p.is_superadmin);
  const hasRbacCreate = permissions?.some(
    (p) => `${p.resource_name}:${p.action_name}` === "rbac:create",
  );

  if (!isSuperAdmin && !hasRbacCreate) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, password } = await request.json();

  if (!userId || !password) {
    return Response.json(
      { error: "userId and password are required" },
      { status: 400 },
    );
  }

  if (password.length < 6) {
    return Response.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { password },
  );

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ success: true });
}
