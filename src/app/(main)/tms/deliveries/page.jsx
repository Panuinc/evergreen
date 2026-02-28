"use client";

import { useDeliveries } from "@/hooks/tms/useDeliveries";
import DeliveriesView from "@/components/tms/DeliveriesView";

export default function DeliveriesPage() {
  const {
    deliveries,
    shipments,
    loading,
    saving,
    editingDelivery,
    formData,
    deletingDelivery,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useDeliveries();

  return (
    <DeliveriesView
      deliveries={deliveries}
      shipments={shipments}
      loading={loading}
      saving={saving}
      editingDelivery={editingDelivery}
      formData={formData}
      deletingDelivery={deletingDelivery}
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
