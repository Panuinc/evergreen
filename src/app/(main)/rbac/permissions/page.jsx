"use client";

import { usePermissions } from "@/modules/rbac/hooks/usePermissions";
import PermissionsView from "@/modules/rbac/components/PermissionsView";

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
