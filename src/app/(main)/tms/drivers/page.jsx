"use client";

import { useDrivers } from "@/modules/tms/hooks/useDrivers";
import DriversView from "@/modules/tms/components/DriversView";

export default function DriversPage() {
  const {
    drivers,
    employees,
    loading,
    saving,
    editingDriver,
    formData,
    deletingDriver,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    toggleActive,
  } = useDrivers();

  return (
    <DriversView
      drivers={drivers}
      employees={employees}
      loading={loading}
      saving={saving}
      editingDriver={editingDriver}
      formData={formData}
      deletingDriver={deletingDriver}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      toggleActive={toggleActive}
    />
  );
}
