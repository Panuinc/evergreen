"use client";

import { useFuelLogs } from "@/modules/tms/hooks/useFuelLogs";
import FuelLogsView from "@/modules/tms/components/FuelLogsView";

export default function FuelLogsPage() {
  const {
    fuelLogs,
    vehicles,
    drivers,
    loading,
    saving,
    editingFuelLog,
    formData,
    deletingFuelLog,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useFuelLogs();

  return (
    <FuelLogsView
      fuelLogs={fuelLogs}
      vehicles={vehicles}
      drivers={drivers}
      loading={loading}
      saving={saving}
      editingFuelLog={editingFuelLog}
      formData={formData}
      deletingFuelLog={deletingFuelLog}
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
