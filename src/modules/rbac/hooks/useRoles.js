"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole,
} from "@/modules/rbac/actions";

export function useRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    rbacRoleName: "",
    rbacRoleDescription: "",
    rbacRoleIsSuperadmin: false,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Permission assignment state
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermIds, setRolePermIds] = useState([]);
  const [permLoading, setPermLoading] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      toast.error("โหลดบทบาทล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (role = null) => {
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
        await updateRole(editingRole.rbacRoleId, formData);
        toast.success("อัปเดตบทบาทสำเร็จ");
      } else {
        await createRole(formData);
        toast.success("สร้างบทบาทสำเร็จ");
      }
      onClose();
      loadRoles();
    } catch (error) {
      toast.error(error.message || "บันทึกบทบาทล้มเหลว");
    }
  };

  const handleDelete = async (role) => {
    if (role.rbacRoleIsSuperadmin) {
      toast.error("ไม่สามารถลบบทบาท superadmin ได้");
      return;
    }

    try {
      await deleteRole(role.rbacRoleId);
      toast.success("ลบบทบาทสำเร็จ");
      loadRoles();
    } catch (error) {
      toast.error(error.message || "ลบบทบาทล้มเหลว");
    }
  };

  const openPermissions = async (role) => {
    setSelectedRole(role);
    setPermLoading(true);
    setPermModalOpen(true);

    try {
      const [perms, rolePerm] = await Promise.all([
        getPermissions(),
        getRolePermissions(role.rbacRoleId),
      ]);
      setAllPermissions(perms);
      setRolePermIds(rolePerm.map((rp) => rp.rbacRolePermissionPermissionId));
    } catch (error) {
      toast.error("โหลดสิทธิ์ล้มเหลว");
    } finally {
      setPermLoading(false);
    }
  };

  const togglePermission = async (permissionId) => {
    if (!selectedRole) return;

    try {
      if (rolePermIds.includes(permissionId)) {
        await removePermissionFromRole(selectedRole.rbacRoleId, permissionId);
        setRolePermIds((prev) => prev.filter((id) => id !== permissionId));
        toast.success("ลบสิทธิ์สำเร็จ");
      } else {
        await assignPermissionToRole(selectedRole.rbacRoleId, permissionId);
        setRolePermIds((prev) => [...prev, permissionId]);
        toast.success("กำหนดสิทธิ์สำเร็จ");
      }
    } catch (error) {
      toast.error("อัปเดตสิทธิ์ล้มเหลว");
    }
  };

  // Group permissions by resource for display
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const resourceName = perm.resources?.rbacResourceName || "Unknown";
    if (!acc[resourceName]) acc[resourceName] = [];
    acc[resourceName].push(perm);
    return acc;
  }, {});

  return {
    roles,
    loading,
    editingRole,
    formData,
    setFormData,
    isOpen,
    onClose,
    handleOpen,
    handleSave,
    handleDelete,
    permModalOpen,
    setPermModalOpen,
    selectedRole,
    permLoading,
    allPermissions,
    rolePermIds,
    groupedPermissions,
    openPermissions,
    togglePermission,
  };
}
