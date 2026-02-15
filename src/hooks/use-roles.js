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
      toast.error("Failed to load roles");
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
      toast.error("Role name is required");
      return;
    }

    try {
      if (editingRole) {
        await updateRole(editingRole.roleId, formData);
        toast.success("Role updated");
      } else {
        await createRole(formData);
        toast.success("Role created");
      }
      onClose();
      loadRoles();
    } catch (error) {
      toast.error(error.message || "Failed to save role");
    }
  };

  const handleDelete = async (role) => {
    if (role.roleIsSuperadmin) {
      toast.error("Cannot delete superadmin role");
      return;
    }

    try {
      await deleteRole(role.roleId);
      toast.success("Role deleted");
      loadRoles();
    } catch (error) {
      toast.error(error.message || "Failed to delete role");
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
      toast.error("Failed to load permissions");
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
        toast.success("Permission removed");
      } else {
        await assignPermissionToRole(selectedRole.roleId, permissionId);
        setRolePermIds((prev) => [...prev, permissionId]);
        toast.success("Permission assigned");
      }
    } catch (error) {
      toast.error("Failed to update permission");
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
