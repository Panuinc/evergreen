"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { post, del } from "@/lib/apiClient";
import PermissionsView from "@/modules/rbac/components/permissionsView";

export default function PermissionsClient({
  initialResources,
  initialActions,
  initialPermissions,
}) {
  const [resources] = useState(initialResources);
  const [actions] = useState(initialActions);
  const [permissions, setPermissions] = useState(initialPermissions);
  const [loading] = useState(false);
  const [toggling, setToggling] = useState(null);

  const permMap = useMemo(() => {
    const map = {};
    permissions.forEach((p) => {
      map[`${p.rbacPermissionResourceId}:${p.rbacPermissionActionId}`] = p;
    });
    return map;
  }, [permissions]);

  const togglePermission = async (resourceId, actionId) => {
    const key = `${resourceId}:${actionId}`;
    setToggling(key);

    try {
      const existing = permMap[key];
      if (existing) {
        await del(`/api/rbac/permissions/${existing.rbacPermissionId}`);
        setPermissions((prev) =>
          prev.filter((p) => p.rbacPermissionId !== existing.rbacPermissionId)
        );
        toast.success("ลบสิทธิ์สำเร็จ");
      } else {
        const newPerm = await post("/api/rbac/permissions", {
          rbacPermissionResourceId: resourceId,
          rbacPermissionActionId: actionId,
        });
        setPermissions((prev) => [...prev, newPerm]);
        toast.success("สร้างสิทธิ์สำเร็จ");
      }
    } catch (error) {
      toast.error("อัปเดตสิทธิ์ล้มเหลว");
    } finally {
      setToggling(null);
    }
  };

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
