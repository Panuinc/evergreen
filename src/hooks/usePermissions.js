"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  getResources,
  getActions,
  getPermissions,
  createPermission,
  deletePermission,
} from "@/actions/rbac";

export function usePermissions() {
  const [resources, setResources] = useState([]);
  const [actions, setActions] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [res, act, perms] = await Promise.all([
        getResources(),
        getActions(),
        getPermissions(),
      ]);
      setResources(res);
      setActions(act);
      setPermissions(perms);
    } catch (error) {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const permMap = useMemo(() => {
    const map = {};
    permissions.forEach((p) => {
      map[`${p.permissionResourceId}:${p.permissionActionId}`] = p;
    });
    return map;
  }, [permissions]);

  const togglePermission = async (resourceId, actionId) => {
    const key = `${resourceId}:${actionId}`;
    setToggling(key);

    try {
      const existing = permMap[key];
      if (existing) {
        await deletePermission(existing.permissionId);
        setPermissions((prev) =>
          prev.filter((p) => p.permissionId !== existing.permissionId),
        );
        toast.success("ลบสิทธิ์สำเร็จ");
      } else {
        const newPerm = await createPermission({
          permissionResourceId: resourceId,
          permissionActionId: actionId,
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

  return {
    resources,
    actions,
    permissions,
    loading,
    toggling,
    permMap,
    togglePermission,
  };
}
