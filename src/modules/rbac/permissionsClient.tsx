"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { post, del } from "@/lib/apiClient";
import PermissionsView from "@/modules/rbac/components/permissionsView";
import type {
  RbacResource,
  RbacAction,
  RbacPermission,
  PermissionMap,
  PermissionsClientProps,
} from "@/modules/rbac/types";

export default function PermissionsClient({
  initialResources,
  initialActions,
  initialPermissions,
}: PermissionsClientProps) {
  const [resources] = useState<RbacResource[]>(initialResources);
  const [actions] = useState<RbacAction[]>(initialActions);
  const [permissions, setPermissions] = useState<RbacPermission[]>(initialPermissions);
  const [loading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);

  const permMap = useMemo<PermissionMap>(() => {
    const map: PermissionMap = {};
    permissions.forEach((p) => {
      map[`${p.rbacPermissionResourceId}:${p.rbacPermissionActionId}`] = p;
    });
    return map;
  }, [permissions]);

  const togglePermission = async (resourceId: string, actionId: string) => {
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
        setPermissions((prev) => [...prev, newPerm as RbacPermission]);
        toast.success("สร้างสิทธิ์สำเร็จ");
      }
    } catch {
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
