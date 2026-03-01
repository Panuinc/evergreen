import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data: users, error: usersError } = await supabase
    .from("rbacUserProfile")
    .select("*")
    .order("rbacUserProfileCreatedAt", { ascending: false });

  if (usersError)
    return Response.json({ error: usersError.message }, { status: 500 });

  const { data: allUserRoles, error: rolesError } = await supabase
    .from("rbacUserRole")
    .select("*, rbacRole(*)")
    .eq("isActive", true);

  if (rolesError)
    return Response.json({ error: rolesError.message }, { status: 500 });

  const result = users.map((user) => ({
    ...user,
    roles: allUserRoles
      .filter((ur) => ur.rbacUserRoleUserId === user.rbacUserProfileId)
      .map((ur) => ur.rbacRole),
    userRoles: allUserRoles.filter(
      (ur) => ur.rbacUserRoleUserId === user.rbacUserProfileId
    ),
  }));

  return Response.json(result);
}
