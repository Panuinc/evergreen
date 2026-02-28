"use client";

import { useEmployees } from "@/hooks/hr/useEmployees";
import EmployeesView from "@/components/hr/EmployeesView";

export default function EmployeesPage() {
  const {
    employees,
    divisions,
    departments,
    positions,
    loading,
    saving,
    editingEmployee,
    formData,
    deletingEmployee,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useEmployees();

  return (
    <EmployeesView
      employees={employees}
      divisions={divisions}
      departments={departments}
      positions={positions}
      loading={loading}
      saving={saving}
      editingEmployee={editingEmployee}
      formData={formData}
      onUpdateField={updateField}
      deletingEmployee={deletingEmployee}
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
