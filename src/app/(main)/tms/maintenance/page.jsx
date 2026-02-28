"use client";

import { useMaintenance } from "@/modules/tms/hooks/useMaintenance";
import MaintenanceView from "@/modules/tms/components/MaintenanceView";

export default function MaintenancePage() {
  const {
    maintenance,
    vehicles,
    loading,
    saving,
    editingMaintenance,
    formData,
    deletingMaintenance,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useMaintenance();

  return (
    <MaintenanceView
      maintenance={maintenance}
      vehicles={vehicles}
      loading={loading}
      saving={saving}
      editingMaintenance={editingMaintenance}
      formData={formData}
      deletingMaintenance={deletingMaintenance}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
    />
  );
}
