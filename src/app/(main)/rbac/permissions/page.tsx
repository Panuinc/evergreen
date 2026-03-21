import { api } from "@/lib/api.server";
import PermissionsClient from "@/modules/rbac/permissionsClient";
import type { RbacResource, RbacAction, RbacPermission } from "@/modules/rbac/types";

export default async function PermissionsPage() {
  const [resources, actions, permissions] = await Promise.all([
    api("/api/rbac/resources"),
    api("/api/rbac/actions"),
    api("/api/rbac/permissions"),
  ]);

  return (
    <PermissionsClient
      initialResources={(resources || []) as RbacResource[]}
      initialActions={(actions || []) as RbacAction[]}
      initialPermissions={(permissions || []) as RbacPermission[]}
    />
  );
}
