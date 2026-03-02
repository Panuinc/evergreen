"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getUsersWithRoles,
  getRoles,
  assignRoleToUser,
  removeRoleFromUser,
  createUser,
  resetUserPassword,
  toggleUserStatus,
} from "@/modules/rbac/actions";
import { getUnlinkedEmployees } from "@/modules/hr/actions";

const defaultPassword = "P@ssw0rd";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role assignment
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoleIds, setUserRoleIds] = useState([]);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Reset password
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState(defaultPassword);
  const [resetting, setResetting] = useState(false);

  // Create account
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: defaultPassword,
    employeeId: "",
  });
  const [creating, setCreating] = useState(false);
  const [unlinkedEmployees, setUnlinkedEmployees] = useState([]);

  // Toggle user status
  const [togglingUserId, setTogglingUserId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        getUsersWithRoles(),
        getRoles(),
      ]);
      setUsers(usersData);
      setAllRoles(rolesData);
    } catch (error) {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const openRoleAssignment = (user) => {
    setSelectedUser(user);
    setUserRoleIds(user.roles?.map((r) => r.rbacRoleId) || []);
    onOpen();
  };

  const toggleRole = async (roleId) => {
    if (!selectedUser) return;
    setSaving(true);

    try {
      if (userRoleIds.includes(roleId)) {
        await removeRoleFromUser(selectedUser.rbacUserProfileId, roleId);
        setUserRoleIds((prev) => prev.filter((id) => id !== roleId));
        toast.success("ลบบทบาทสำเร็จ");
      } else {
        await assignRoleToUser(selectedUser.rbacUserProfileId, roleId);
        setUserRoleIds((prev) => [...prev, roleId]);
        toast.success("กำหนดบทบาทสำเร็จ");
      }
    } catch (error) {
      toast.error("อัปเดตบทบาทล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseRoles = () => {
    onClose();
    loadData();
  };

  // Create account
  const openCreateAccount = async () => {
    setCreateForm({ email: "", password: defaultPassword, employeeId: "" });
    setCreateOpen(true);

    try {
      const data = await getUnlinkedEmployees();
      setUnlinkedEmployees(data || []);
    } catch {
      setUnlinkedEmployees([]);
    }
  };

  const handleCreateAccount = async () => {
    if (!createForm.email || !createForm.password) {
      toast.error("กรุณาระบุอีเมลและรหัสผ่าน");
      return;
    }
    if (createForm.password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setCreating(true);

    try {
      const result = await createUser({
        email: createForm.email,
        password: createForm.password,
        employeeId: createForm.employeeId || null,
      });

      if (result.warning) {
        toast.warning(result.warning);
      } else {
        toast.success("สร้างบัญชีสำเร็จ");
      }

      setCreateOpen(false);
      loadData();
    } catch (error) {
      toast.error("สร้างบัญชีล้มเหลว");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    setTogglingUserId(user.rbacUserProfileId);
    try {
      await toggleUserStatus(user.rbacUserProfileId, !user.isActive);
      toast.success(
        !user.isActive ? "เปิดใช้งานบัญชีสำเร็จ" : "ปิดใช้งานบัญชีสำเร็จ"
      );
      await loadData();
    } catch (error) {
      toast.error("อัปเดตสถานะล้มเหลว");
    } finally {
      setTogglingUserId(null);
    }
  };

  const openResetPassword = (user) => {
    setResetTarget(user);
    setResetPassword(defaultPassword);
    setResetOpen(true);
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !resetPassword) return;
    if (resetPassword.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setResetting(true);
    try {
      await resetUserPassword(resetTarget.rbacUserProfileId, resetPassword);
      toast.success("รีเซ็ตรหัสผ่านสำเร็จ");
      setResetOpen(false);
    } catch (error) {
      toast.error("รีเซ็ตรหัสผ่านล้มเหลว");
    } finally {
      setResetting(false);
    }
  };

  return {
    users,
    allRoles,
    loading,
    selectedUser,
    userRoleIds,
    saving,
    isOpen,
    toggleRole,
    openRoleAssignment,
    handleCloseRoles,
    createOpen,
    setCreateOpen,
    createForm,
    setCreateForm,
    creating,
    unlinkedEmployees,
    openCreateAccount,
    handleCreateAccount,
    resetOpen,
    setResetOpen,
    resetTarget,
    resetPassword,
    setResetPassword,
    resetting,
    openResetPassword,
    handleResetPassword,
    togglingUserId,
    handleToggleUserStatus,
  };
}
