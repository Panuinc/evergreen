"use client";

import { useDepartments } from "@/modules/hr/hooks/useDepartments";
import DepartmentsView from "@/modules/hr/components/DepartmentsView";

export default function DepartmentsPage() {
  const {
    departments,
    divisions,
    loading,
    saving,
    editingDept,
    formData,
    setFormData,
    deletingDept,
    isOpen,
    onClose,
    deleteModal,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useDepartments();

  return (
    <DepartmentsView
      departments={departments}
      divisions={divisions}
      loading={loading}
      saving={saving}
      editingDept={editingDept}
      formData={formData}
      onFormDataChange={setFormData}
      deletingDept={deletingDept}
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
