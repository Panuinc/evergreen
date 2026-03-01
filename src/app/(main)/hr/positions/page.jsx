"use client";

import { usePositions } from "@/modules/hr/hooks/usePositions";
import PositionsView from "@/modules/hr/components/PositionsView";

export default function PositionsPage() {
  const {
    positions,
    departments,
    loading,
    saving,
    editingPos,
    formData,
    setFormData,
    deletingPos,
    isOpen,
    onClose,
    deleteModal,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    toggleActive,
  } = usePositions();

  return (
    <PositionsView
      positions={positions}
      departments={departments}
      loading={loading}
      saving={saving}
      editingPos={editingPos}
      formData={formData}
      onFormDataChange={setFormData}
      deletingPos={deletingPos}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      onOpen={handleOpen}
      onSave={handleSave}
      onConfirmDelete={confirmDelete}
      onDelete={handleDelete}
      toggleActive={toggleActive}
    />
  );
}
