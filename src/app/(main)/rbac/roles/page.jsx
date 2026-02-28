"use client";

import { useRoles } from "@/modules/rbac/hooks/useRoles";
import RolesView from "@/modules/rbac/components/RolesView";

export default function RolesPage() {
  const {
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
    rolePermIds,
    groupedPermissions,
    openPermissions,
    togglePermission,
  } = useRoles();

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
    />
  );
}
