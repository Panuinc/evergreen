import { api } from "@/lib/api.server";
import RolesClient from "@/modules/rbac/rolesClient";

export default async function RolesPage() {
  const roles = await api("/api/rbac/roles");

  return <RolesClient initialRoles={roles || []} />;
}
