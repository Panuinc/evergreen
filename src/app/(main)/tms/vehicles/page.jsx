"use client";

import { useVehicles } from "@/hooks/tms/useVehicles";
import VehiclesView from "@/components/tms/VehiclesView";

export default function VehiclesPage() {
  const {
    vehicles,
    loading,
    saving,
    editingVehicle,
    formData,
    validationErrors,
    deletingVehicle,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useVehicles();

  return (
    <VehiclesView
      vehicles={vehicles}
      loading={loading}
      saving={saving}
      editingVehicle={editingVehicle}
      formData={formData}
      validationErrors={validationErrors}
      deletingVehicle={deletingVehicle}
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
