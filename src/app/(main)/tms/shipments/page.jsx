"use client";

import { useShipments } from "@/hooks/tms/useShipments";
import ShipmentsView from "@/components/tms/ShipmentsView";

export default function ShipmentsPage() {
  const {
    shipments,
    vehicles,
    drivers,
    routes,
    loading,
    saving,
    editingShipment,
    formData,
    deletingShipment,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    handleStatusChange,
  } = useShipments();

  return (
    <ShipmentsView
      shipments={shipments}
      vehicles={vehicles}
      drivers={drivers}
      routes={routes}
      loading={loading}
      saving={saving}
      editingShipment={editingShipment}
      formData={formData}
      deletingShipment={deletingShipment}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      handleStatusChange={handleStatusChange}
    />
  );
}
