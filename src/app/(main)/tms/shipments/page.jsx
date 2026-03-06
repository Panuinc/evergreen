"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useShipments } from "@/modules/tms/hooks/useShipments";
import ShipmentsView from "@/modules/tms/components/ShipmentsView";

function ShipmentsPageInner() {
  const searchParams = useSearchParams();
  const fromPlanId = searchParams.get("planId") || null;

  const {
    shipments,
    vehicles,
    employees,
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
    toggleActive,
    deliveryPlans,
    plansLoading,
    selectedPlanIds,
    togglePlanSelection,
    shipmentStops,
    shipmentItems,
    updateItemActualQty,
    distanceLoading,
    addExtra,
    updateExtra,
    removeExtra,
    routeResult,
    routeAiAnalysis,
    routeLoading,
    optimizeRoute,
    clearRouteResult,
  } = useShipments(fromPlanId);

  return (
    <ShipmentsView
      shipments={shipments}
      vehicles={vehicles}
      employees={employees}
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
      toggleActive={toggleActive}
      deliveryPlans={deliveryPlans}
      plansLoading={plansLoading}
      selectedPlanIds={selectedPlanIds}
      togglePlanSelection={togglePlanSelection}
      shipmentStops={shipmentStops}
      shipmentItems={shipmentItems}
      updateItemActualQty={updateItemActualQty}
      distanceLoading={distanceLoading}
      addExtra={addExtra}
      updateExtra={updateExtra}
      removeExtra={removeExtra}
      routeResult={routeResult}
      routeAiAnalysis={routeAiAnalysis}
      routeLoading={routeLoading}
      optimizeRoute={optimizeRoute}
      clearRouteResult={clearRouteResult}
    />
  );
}

export default function ShipmentsPage() {
  return (
    <Suspense>
      <ShipmentsPageInner />
    </Suspense>
  );
}
