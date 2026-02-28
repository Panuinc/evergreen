"use client";

import { usePermissions } from "@/hooks/rbac/usePermissions";
import PermissionsView from "@/components/rbac/PermissionsView";

export default function PermissionsPage() {
  const {
    resources,
    actions,
    loading,
    toggling,
    permMap,
    togglePermission,
  } = usePermissions();

  return (
    <PermissionsView
      resources={resources}
      actions={actions}
      loading={loading}
      toggling={toggling}
      permMap={permMap}
      togglePermission={togglePermission}
    />
  );
}
