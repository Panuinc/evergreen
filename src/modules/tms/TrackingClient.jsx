"use client";

import { useGpsTracking } from "@/modules/tms/useGpsTracking";
import TrackingView from "@/modules/tms/components/TrackingView";

export default function TrackingClient() {
  const {
    positions,
    vehicles,
    loading,
    saving,
    selectedVehicle,
    formData,
    validationErrors,
    isOpen,
    onClose,
    updateField,
    handleOpenManualUpdate,
    handleSavePosition,
    loadData,
    selectedVehicleId,
    setSelectedVehicleId,
    routeHistory,
    loadingRoute,
    routeModal,
    loadRouteHistory,
    selectedDate,
    handleDateChange,
  } = useGpsTracking();

  return (
    <TrackingView
      positions={positions}
      vehicles={vehicles}
      loading={loading}
      saving={saving}
      selectedVehicle={selectedVehicle}
      formData={formData}
      validationErrors={validationErrors}
      isOpen={isOpen}
      onClose={onClose}
      updateField={updateField}
      handleOpenManualUpdate={handleOpenManualUpdate}
      handleSavePosition={handleSavePosition}
      loadData={loadData}
      selectedVehicleId={selectedVehicleId}
      setSelectedVehicleId={setSelectedVehicleId}
      routeHistory={routeHistory}
      loadingRoute={loadingRoute}
      routeModal={routeModal}
      loadRouteHistory={loadRouteHistory}
      selectedDate={selectedDate}
      handleDateChange={handleDateChange}
    />
  );
}
