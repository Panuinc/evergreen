"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDeliveries } from "@/modules/tms/hooks/useDeliveries";
import DeliveriesView from "@/modules/tms/components/DeliveriesView";

function DeliveriesPageInner() {
  const searchParams = useSearchParams();
  const fromShipmentId = searchParams.get("shipmentId") || null;

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
    deliveryItems,
    updateDeliveryItem,
  } = useDeliveries(fromShipmentId);

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
      deliveryItems={deliveryItems}
      updateDeliveryItem={updateDeliveryItem}
    />
  );
}

export default function DeliveriesPage() {
  return (
    <Suspense>
      <DeliveriesPageInner />
    </Suspense>
  );
}
