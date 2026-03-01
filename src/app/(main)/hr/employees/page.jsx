"use client";

import { useEmployees } from "@/modules/hr/hooks/useEmployees";
import EmployeesView from "@/modules/hr/components/EmployeesView";

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
    toggleActive,
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
      toggleActive={toggleActive}
    />
  );
}
