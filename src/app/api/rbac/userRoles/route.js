import { withAuth } from "@/app/api/_lib/auth";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data: users, error: usersError } = await supabase
    .from("userProfiles")
    .select("*")
    .order("userProfileCreatedAt", { ascending: false });

  if (usersError)
    return Response.json({ error: usersError.message }, { status: 500 });

  const { data: allUserRoles, error: rolesError } = await supabase
    .from("userRoles")
    .select("*, roles(*)");

  if (rolesError)
    return Response.json({ error: rolesError.message }, { status: 500 });

  const result = users.map((user) => ({
    ...user,
    roles: allUserRoles
      .filter((ur) => ur.userRoleUserId === user.userProfileId)
      .map((ur) => ur.roles),
    userRoles: allUserRoles.filter(
      (ur) => ur.userRoleUserId === user.userProfileId
    ),
  }));

  return Response.json(result);
}
