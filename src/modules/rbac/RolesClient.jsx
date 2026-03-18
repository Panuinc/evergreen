"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { get, post, put, del } from "@/lib/apiClient";
import RolesView from "@/modules/rbac/components/RolesView";

export default function RolesClient({ initialRoles }) {
  const [roles, setRoles] = useState(initialRoles);
  const [loading, setLoading] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    rbacRoleName: "",
    rbacRoleDescription: "",
    rbacRoleIsSuperadmin: false,
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [permModalOpen, setPermModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [rolePermIds, setRolePermIds] = useState([]);
  const [permLoading, setPermLoading] = useState(false);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await get("/api/rbac/roles");
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
        await put(`/api/rbac/roles/${editingRole.rbacRoleId}`, formData);
        toast.success("อัปเดตบทบาทสำเร็จ");
      } else {
        await post("/api/rbac/roles", formData);
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
      await del(`/api/rbac/roles/${role.rbacRoleId}`);
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
        get("/api/rbac/permissions"),
        get(`/api/rbac/rolePermissions/${role.rbacRoleId}`),
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
    } catch (error) {
      toast.error("อัปเดตสิทธิ์ล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/rbac/roles/${item.rbacRoleId}`, {
        isActive: !item.isActive,
      });
      toast.success(
        item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ"
      );
      loadRoles();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    const resourceName = perm.rbacResource?.rbacResourceName || "Unknown";
    if (!acc[resourceName]) acc[resourceName] = [];
    acc[resourceName].push(perm);
    return acc;
  }, {});

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
