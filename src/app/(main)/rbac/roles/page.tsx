import { api } from "@/lib/api.server";
import RolesClient from "@/modules/rbac/rolesClient";
import type { RbacRole } from "@/modules/rbac/types";

export default async function RolesPage() {
  const roles = await api("/api/rbac/roles");

  return <RolesClient initialRoles={(roles || []) as RbacRole[]} />;
}
