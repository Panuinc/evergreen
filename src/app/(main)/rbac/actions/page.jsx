"use client";

import { useActions } from "@/modules/rbac/hooks/useActions";
import ActionsView from "@/modules/rbac/components/ActionsView";

export default function ActionsPage() {
  const {
    actions,
    loading,
    editingAction,
    formData,
    setFormData,
    isOpen,
    onClose,
    handleOpen,
    handleSave,
    handleDelete,
  } = useActions();

  return (
    <ActionsView
      actions={actions}
      loading={loading}
      editingAction={editingAction}
      formData={formData}
      setFormData={setFormData}
      isOpen={isOpen}
      onClose={onClose}
      handleOpen={handleOpen}
      handleSave={handleSave}
      handleDelete={handleDelete}
    />
  );
}
