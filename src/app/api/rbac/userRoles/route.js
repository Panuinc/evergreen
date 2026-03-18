import { withAuth } from "@/app/api/_lib/auth";
import { fetchAll } from "@/app/api/_lib/fetchAll";

export async function GET() {
  const auth = await withAuth();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data: users, error: usersError } = await fetchAll(supabase
    .from("rbacUserProfile")
    .select("*")
    .order("rbacUserProfileCreatedAt", { ascending: false }));

  if (usersError)
    return Response.json({ error: usersError.message }, { status: 500 });

  const { data: allUserRoles, error: rolesError } = await fetchAll(supabase
    .from("rbacUserRole")
    .select("*, rbacRole(*)")
    .eq("isActive", true));

  if (rolesError)
    return Response.json({ error: rolesError.message }, { status: 500 });

  const result = users.map((user) => {
    const userRoles = allUserRoles.filter(
      (ur) => ur.rbacUserRoleUserId === user.rbacUserProfileId
    );
    return {
      ...user,
      roles: userRoles.map((ur) => ur.rbacRole),
      userRoles,
    };
  });

  return Response.json(result);
}
