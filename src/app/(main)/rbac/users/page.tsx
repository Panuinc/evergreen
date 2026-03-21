import { api } from "@/lib/api.server";
import UsersClient from "@/modules/rbac/usersClient";
import type { RbacUserProfile, RbacRole } from "@/modules/rbac/types";

export default async function UsersPage() {
  const [users, roles] = await Promise.all([
    api("/api/rbac/userRoles"),
    api("/api/rbac/roles"),
  ]);

  return (
    <UsersClient
      initialUsers={(users || []) as RbacUserProfile[]}
      initialRoles={(roles || []) as RbacRole[]}
    />
  );
}
