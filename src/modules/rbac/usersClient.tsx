"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { get, post, patch, del } from "@/lib/apiClient";
import UsersView from "@/modules/rbac/components/usersView";
import type {
  RbacUserProfile,
  RbacRole,
  CreateUserFormData,
  HrEmployee,
  UsersClientProps,
} from "@/modules/rbac/types";

const defaultPassword = "P@ssw0rd";

export default function UsersClient({ initialUsers, initialRoles }: UsersClientProps) {
  const [users, setUsers] = useState<RbacUserProfile[]>(initialUsers);
  const [allRoles] = useState<RbacRole[]>(initialRoles);
  const [loading, setLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState<RbacUserProfile | null>(null);
  const [userRoleIds, setUserRoleIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<RbacUserProfile | null>(null);
  const [resetPassword, setResetPassword] = useState(defaultPassword);
  const [resetting, setResetting] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormData>({
    email: "",
    password: defaultPassword,
    employeeId: "",
  });
  const [creating, setCreating] = useState(false);
  const [unlinkedEmployees, setUnlinkedEmployees] = useState<HrEmployee[]>([]);

  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData] = await Promise.all([
        get("/api/rbac/userRoles"),
        get("/api/rbac/roles"),
      ]);
      setUsers(usersData as RbacUserProfile[]);
    } catch {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const openRoleAssignment = (user: RbacUserProfile) => {
    setSelectedUser(user);
    setUserRoleIds(user.roles?.map((r) => r.rbacRoleId) || []);
    onOpen();
  };

  const toggleRole = async (roleId: string) => {
    if (!selectedUser) return;
    setSaving(true);

    try {
      if (userRoleIds.includes(roleId)) {
        await del(
          `/api/rbac/userRoles/${selectedUser.rbacUserProfileId}?rbacUserRoleRoleId=${roleId}`
        );
        setUserRoleIds((prev) => prev.filter((id) => id !== roleId));
        toast.success("ลบบทบาทสำเร็จ");
      } else {
        await post(`/api/rbac/userRoles/${selectedUser.rbacUserProfileId}`, {
          rbacUserRoleRoleId: roleId,
        });
        setUserRoleIds((prev) => [...prev, roleId]);
        toast.success("กำหนดบทบาทสำเร็จ");
      }
    } catch {
      toast.error("อัปเดตบทบาทล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseRoles = () => {
    onClose();
    loadData();
  };

  const openCreateAccount = async () => {
    setCreateForm({ email: "", password: defaultPassword, employeeId: "" });
    setCreateOpen(true);

    try {
      const data = await get("/api/hr/unlinkedEmployees");
      setUnlinkedEmployees((data as HrEmployee[]) || []);
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
      const result = await post("/api/admin/createUser", {
        email: createForm.email,
        password: createForm.password,
        employeeId: createForm.employeeId || null,
      }) as { warning?: string } | null;

      if (result?.warning) {
        toast.warning(result.warning);
      } else {
        toast.success("สร้างบัญชีสำเร็จ");
      }

      setCreateOpen(false);
      loadData();
    } catch {
      toast.error("สร้างบัญชีล้มเหลว");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleUserStatus = async (user: RbacUserProfile) => {
    setTogglingUserId(user.rbacUserProfileId);
    try {
      await patch(`/api/rbac/userRoles/${user.rbacUserProfileId}`, {
        isActive: !user.isActive,
      });
      toast.success(
        !user.isActive ? "เปิดใช้งานบัญชีสำเร็จ" : "ปิดใช้งานบัญชีสำเร็จ"
      );
      await loadData();
    } catch {
      toast.error("อัปเดตสถานะล้มเหลว");
    } finally {
      setTogglingUserId(null);
    }
  };

  const openResetPassword = (user: RbacUserProfile) => {
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
      await post("/api/admin/resetPassword", {
        userId: resetTarget.rbacUserProfileId,
        password: resetPassword,
      });
      toast.success("รีเซ็ตรหัสผ่านสำเร็จ");
      setResetOpen(false);
    } catch {
      toast.error("รีเซ็ตรหัสผ่านล้มเหลว");
    } finally {
      setResetting(false);
    }
  };

  return (
    <UsersView
      users={users}
      allRoles={allRoles}
      loading={loading}
      selectedUser={selectedUser}
      userRoleIds={userRoleIds}
      saving={saving}
      isOpen={isOpen}
      toggleRole={toggleRole}
      openRoleAssignment={openRoleAssignment}
      handleCloseRoles={handleCloseRoles}
      createOpen={createOpen}
      setCreateOpen={setCreateOpen}
      createForm={createForm}
      setCreateForm={setCreateForm}
      creating={creating}
      unlinkedEmployees={unlinkedEmployees}
      openCreateAccount={openCreateAccount}
      handleCreateAccount={handleCreateAccount}
      resetOpen={resetOpen}
      setResetOpen={setResetOpen}
      resetTarget={resetTarget}
      resetPassword={resetPassword}
      setResetPassword={setResetPassword}
      resetting={resetting}
      openResetPassword={openResetPassword}
      handleResetPassword={handleResetPassword}
      togglingUserId={togglingUserId}
      handleToggleUserStatus={handleToggleUserStatus}
    />
  );
}
