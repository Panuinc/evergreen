"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { get, post, put, del } from "@/lib/apiClient";
import RolesView from "@/modules/rbac/components/rolesView";
import type {
  RbacRole,
  RbacPermission,
  RoleFormData,
  GroupedPermissions,
  RolesClientProps,
} from "@/modules/rbac/types";

export default function RolesClient({ initialRoles }: RolesClientProps) {
  const [roles, setRoles] = useState<RbacRole[]>(initialRoles);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<RbacRole | null>(null);
  const [formData, setFormData] = useState<RoleFormData>({
    rbacRoleName: "",
    rbacRoleDescription: "",
    rbacRoleIsSuperadmin: false,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [permModalOpen, setPermModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RbacRole | null>(null);
  const [allPermissions, setAllPermissions] = useState<RbacPermission[]>([]);
  const [rolePermIds, setRolePermIds] = useState<string[]>([]);
  const [permLoading, setPermLoading] = useState(false);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await get("/api/rbac/roles");
      setRoles(data as RbacRole[]);
    } catch {
      toast.error("โหลดบทบาทล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (role: RbacRole | null = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        rbacRoleName: role.rbacRoleName,
        rbacRoleDescription: role.rbacRoleDescription || "",
        rbacRoleIsSuperadmin: role.rbacRoleIsSuperadmin || false,
      });
    } else {
      setEditingRole(null);
      setFormData({
        rbacRoleName: "",
        rbacRoleDescription: "",
        rbacRoleIsSuperadmin: false,
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.rbacRoleName.trim()) {
      toast.error("กรุณาระบุชื่อบทบาท");
      return;
    }

    try {
      if (editingRole) {
        await put(`/api/rbac/roles/${editingRole.rbacRoleId}`, formData);
        toast.success("อัปเดตบทบาทสำเร็จ");
      } else {
        await post("/api/rbac/roles", formData);
        toast.success("สร้างบทบาทสำเร็จ");
      }
      onClose();
      loadRoles();
    } catch (error) {
      toast.error((error as Error).message || "บันทึกบทบาทล้มเหลว");
    }
  };

  const handleDelete = async (role: RbacRole) => {
    if (role.rbacRoleIsSuperadmin) {
      toast.error("ไม่สามารถลบบทบาท superadmin ได้");
      return;
    }

    try {
      await del(`/api/rbac/roles/${role.rbacRoleId}`);
      toast.success("ลบบทบาทสำเร็จ");
      loadRoles();
    } catch (error) {
      toast.error((error as Error).message || "ลบบทบาทล้มเหลว");
    }
  };

  const openPermissions = async (role: RbacRole) => {
    setSelectedRole(role);
    setPermLoading(true);
    setPermModalOpen(true);

    try {
      const [perms, rolePerm] = await Promise.all([
        get("/api/rbac/permissions"),
        get(`/api/rbac/rolePermissions/${role.rbacRoleId}`),
      ]);
      setAllPermissions(perms as RbacPermission[]);
      setRolePermIds(
        (rolePerm as { rbacRolePermissionPermissionId: string }[]).map(
          (rp) => rp.rbacRolePermissionPermissionId
        )
      );
    } catch {
      toast.error("โหลดสิทธิ์ล้มเหลว");
    } finally {
      setPermLoading(false);
    }
  };

  const togglePermission = async (permissionId: string) => {
    if (!selectedRole) return;

    try {
      if (rolePermIds.includes(permissionId)) {
        await del(
          `/api/rbac/rolePermissions/${selectedRole.rbacRoleId}?rbacRolePermissionPermissionId=${permissionId}`
        );
        setRolePermIds((prev) => prev.filter((id) => id !== permissionId));
        toast.success("ลบสิทธิ์สำเร็จ");
      } else {
        await post(`/api/rbac/rolePermissions/${selectedRole.rbacRoleId}`, {
          rbacRolePermissionPermissionId: permissionId,
        });
        setRolePermIds((prev) => [...prev, permissionId]);
        toast.success("กำหนดสิทธิ์สำเร็จ");
      }
    } catch {
      toast.error("อัปเดตสิทธิ์ล้มเหลว");
    }
  };

  const toggleActive = async (item: RbacRole) => {
    try {
      await put(`/api/rbac/roles/${item.rbacRoleId}`, {
        isActive: !item.isActive,
      });
      toast.success(
        item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ"
      );
      loadRoles();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const groupedPermissions: GroupedPermissions = allPermissions.reduce(
    (acc, perm) => {
      const resourceName =
        perm.rbacResource?.rbacResourceName || "Unknown";
      if (!acc[resourceName]) acc[resourceName] = [];
      acc[resourceName].push(perm);
      return acc;
    },
    {} as GroupedPermissions
  );

  return (
    <RolesView
      roles={roles}
      loading={loading}
      editingRole={editingRole}
      formData={formData}
      setFormData={setFormData}
      isOpen={isOpen}
      onClose={onClose}
      handleOpen={handleOpen}
      handleSave={handleSave}
      handleDelete={handleDelete}
      permModalOpen={permModalOpen}
      setPermModalOpen={setPermModalOpen}
      selectedRole={selectedRole}
      permLoading={permLoading}
      rolePermIds={rolePermIds}
      groupedPermissions={groupedPermissions}
      openPermissions={openPermissions}
      togglePermission={togglePermission}
      toggleActive={toggleActive}
    />
  );
}
