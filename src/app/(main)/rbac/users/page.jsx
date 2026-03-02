"use client";

import { useUsers } from "@/modules/rbac/hooks/useUsers";
import UsersView from "@/modules/rbac/components/UsersView";

export default function UsersPage() {
  const {
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
  } = useUsers();

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
