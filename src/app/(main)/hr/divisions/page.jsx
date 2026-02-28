"use client";

import { useDivisions } from "@/modules/hr/hooks/useDivisions";
import DivisionsView from "@/modules/hr/components/DivisionsView";

export default function DivisionsPage() {
  const {
    divisions,
    loading,
    saving,
    editingDiv,
    formData,
    setFormData,
    deletingDiv,
    isOpen,
    onClose,
    deleteModal,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useDivisions();

  return (
    <DivisionsView
      divisions={divisions}
      loading={loading}
      saving={saving}
      editingDiv={editingDiv}
      formData={formData}
      onFormDataChange={setFormData}
      deletingDiv={deletingDiv}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      onOpen={handleOpen}
      onSave={handleSave}
      onConfirmDelete={confirmDelete}
      onDelete={handleDelete}
    />
  );
}
