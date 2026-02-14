import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase, session } = auth;
  const userId = session.user.id;

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("employeeUserId", userId)
    .maybeSingle();

  const { data: userRoles } = await supabase
    .from("userRoles")
    .select("*, roles(*)")
    .eq("userRoleUserId", userId);

  return Response.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      createdAt: session.user.created_at,
    },
    employee: employee || null,
    roles: (userRoles || []).map((ur) => ur.roles),
  });
}
