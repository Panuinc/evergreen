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
} from "@/actions/rbac";
import { getUnlinkedEmployees } from "@/actions/hr";

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

  // Create account
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    password: defaultPassword,
    employeeId: "",
  });
  const [creating, setCreating] = useState(false);
  const [unlinkedEmployees, setUnlinkedEmployees] = useState([]);

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
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const openRoleAssignment = (user) => {
    setSelectedUser(user);
    setUserRoleIds(user.roles?.map((r) => r.roleId) || []);
    onOpen();
  };

  const toggleRole = async (roleId) => {
    if (!selectedUser) return;
    setSaving(true);

    try {
      if (userRoleIds.includes(roleId)) {
        await removeRoleFromUser(selectedUser.userProfileId, roleId);
        setUserRoleIds((prev) => prev.filter((id) => id !== roleId));
        toast.success("Role removed");
      } else {
        await assignRoleToUser(selectedUser.userProfileId, roleId);
        setUserRoleIds((prev) => [...prev, roleId]);
        toast.success("Role assigned");
      }
    } catch (error) {
      toast.error("Failed to update role");
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
      toast.error("Email and password are required");
      return;
    }
    if (createForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
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
        toast.success("Account created successfully");
      }

      setCreateOpen(false);
      loadData();
    } catch (error) {
      toast.error("Failed to create account");
    } finally {
      setCreating(false);
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
  };
}
