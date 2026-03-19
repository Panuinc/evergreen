import { api } from "@/lib/api.server";
import UsersClient from "@/modules/rbac/usersClient";

export default async function UsersPage() {
  const [users, roles] = await Promise.all([
    api("/api/rbac/userRoles"),
    api("/api/rbac/roles"),
  ]);

  return (
    <UsersClient
      initialUsers={users || []}
      initialRoles={roles || []}
    />
  );
}
