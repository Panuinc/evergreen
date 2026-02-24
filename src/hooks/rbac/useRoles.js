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
} from "@/actions/rbac";

export function useRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    roleName: "",
    roleDescription: "",
    roleIsSuperadmin: false,
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
        roleName: role.roleName,
        roleDescription: role.roleDescription || "",
        roleIsSuperadmin: role.roleIsSuperadmin || false,
      });
    } else {
      setEditingRole(null);
      setFormData({
        roleName: "",
        roleDescription: "",
        roleIsSuperadmin: false,
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.roleName.trim()) {
      toast.error("กรุณาระบุชื่อบทบาท");
      return;
    }

    try {
      if (editingRole) {
        await updateRole(editingRole.roleId, formData);
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
    if (role.roleIsSuperadmin) {
      toast.error("ไม่สามารถลบบทบาท superadmin ได้");
      return;
    }

    try {
      await deleteRole(role.roleId);
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
        getRolePermissions(role.roleId),
      ]);
      setAllPermissions(perms);
      setRolePermIds(rolePerm.map((rp) => rp.rolePermissionPermissionId));
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
        await removePermissionFromRole(selectedRole.roleId, permissionId);
        setRolePermIds((prev) => prev.filter((id) => id !== permissionId));
        toast.success("ลบสิทธิ์สำเร็จ");
      } else {
        await assignPermissionToRole(selectedRole.roleId, permissionId);
        setRolePermIds((prev) => [...prev, permissionId]);
        toast.success("กำหนดสิทธิ์สำเร็จ");
      }
    } catch (error) {
      toast.error("อัปเดตสิทธิ์ล้มเหลว");
    }
  };

  // Group permissions by resource for display
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const resourceName = perm.resources?.resourceName || "Unknown";
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
