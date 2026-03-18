import { api } from "@/lib/api.server";
import PermissionsClient from "@/modules/rbac/PermissionsClient";

export default async function PermissionsPage() {
  const [resources, actions, permissions] = await Promise.all([
    api("/api/rbac/resources"),
    api("/api/rbac/actions"),
    api("/api/rbac/permissions"),
  ]);

  return (
    <PermissionsClient
      initialResources={resources || []}
      initialActions={actions || []}
      initialPermissions={permissions || []}
    />
  );
}
