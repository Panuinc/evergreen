"use client";

import {
  Button,
  Card,
  CardBody,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { MapPin, RefreshCw, Navigation, History } from "lucide-react";
import { useGpsTracking } from "@/hooks/useGpsTracking";
import VehicleMap from "@/components/maps/VehicleMap";
import RoutePlayback from "@/components/maps/RoutePlayback";

const STATUS_COLORS = {
  available: "success",
  in_use: "warning",
  maintenance: "danger",
  retired: "default",
};

export default function GpsTrackingPage() {
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
  } = useGpsTracking();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">GPS Tracking</h2>
        <div className="flex gap-2">
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<RefreshCw size={16} />}
            onPress={loadData}
          >
            Refresh
          </Button>
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Navigation size={16} />}
            onPress={() => handleOpenManualUpdate()}
          >
            Update Position
          </Button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Left Panel - Vehicle List */}
        <div className="w-80 flex-shrink-0 overflow-y-auto flex flex-col gap-2">
          {vehicles.map((vehicle) => {
            const pos = positions.find(
              (p) => p.gpsLogVehicleId === vehicle.vehicleId,
            );
            const isSelected = selectedVehicleId === vehicle.vehicleId;
            return (
              <Card
                key={vehicle.vehicleId}
                shadow="sm"
                isPressable
                onPress={() => setSelectedVehicleId(vehicle.vehicleId)}
                className={isSelected ? "border-2 border-primary" : ""}
              >
                <CardBody className="p-3 gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{vehicle.vehicleName}</h3>
                    <Chip
                      variant="bordered"
                      size="sm"
                      color={STATUS_COLORS[vehicle.vehicleStatus] || "default"}
                    >
                      {vehicle.vehicleStatus}
                    </Chip>
                  </div>
                  <p className="text-xs text-default-500">
                    {vehicle.vehiclePlateNumber}
                  </p>
                  {pos ? (
                    <div className="flex flex-col gap-1 text-xs">
                      <p className="flex items-center gap-1">
                        <MapPin size={12} className="text-primary" />
                        {Number(pos.gpsLogLatitude).toFixed(5)},{" "}
                        {Number(pos.gpsLogLongitude).toFixed(5)}
                      </p>
                      {pos.gpsLogSpeed && (
                        <p className="text-default-400">
                          Speed: {pos.gpsLogSpeed} km/h
                        </p>
                      )}
                      <p className="text-default-400">
                        {new Date(pos.gpsLogRecordedAt).toLocaleString("th-TH")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-default-300">No GPS data</p>
                  )}
                  <div className="flex gap-1">
                    <Button
                      variant="bordered"
                      size="sm"
                      radius="md"
                      onPress={() => handleOpenManualUpdate(vehicle)}
                      className="flex-1"
                    >
                      Update
                    </Button>
                    <Button
                      variant="bordered"
                      size="sm"
                      radius="md"
                      startContent={<History size={12} />}
                      onPress={() => loadRouteHistory(vehicle.vehicleId)}
                      isLoading={loadingRoute && selectedVehicleId === vehicle.vehicleId}
                      className="flex-1"
                    >
                      History
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 rounded-xl overflow-hidden border border-default-200">
          <VehicleMap
            positions={positions}
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleClick={setSelectedVehicleId}
          />
        </div>
      </div>

      <p className="text-xs text-default-400">
        Auto-refreshes every 30 seconds
      </p>

      {/* Manual Update Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            Update Vehicle Position
            {selectedVehicle && ` - ${selectedVehicle.vehicleName}`}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {!selectedVehicle && (
                <Select
                  label="Vehicle"
                  labelPlacement="outside"
                  placeholder="Select vehicle"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={
                    formData.gpsLogVehicleId ? [formData.gpsLogVehicleId] : []
                  }
                  onSelectionChange={(keys) =>
                    updateField("gpsLogVehicleId", Array.from(keys)[0] || "")
                  }
                  isRequired
                >
                  {vehicles.map((v) => (
                    <SelectItem key={v.vehicleId}>
                      {v.vehicleName} ({v.vehiclePlateNumber})
                    </SelectItem>
                  ))}
                </Select>
              )}
              <Input
                type="number"
                label="Latitude"
                labelPlacement="outside"
                placeholder="e.g. 13.7563"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.gpsLogLatitude}
                onChange={(e) => updateField("gpsLogLatitude", e.target.value)}
                isRequired
                isInvalid={!!validationErrors?.gpsLogLatitude}
                errorMessage={validationErrors?.gpsLogLatitude}
              />
              <Input
                type="number"
                label="Longitude"
                labelPlacement="outside"
                placeholder="e.g. 100.5018"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.gpsLogLongitude}
                onChange={(e) => updateField("gpsLogLongitude", e.target.value)}
                isRequired
                isInvalid={!!validationErrors?.gpsLogLongitude}
                errorMessage={validationErrors?.gpsLogLongitude}
              />
              <Input
                type="number"
                label="Speed (km/h)"
                labelPlacement="outside"
                placeholder="Optional"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.gpsLogSpeed}
                onChange={(e) => updateField("gpsLogSpeed", e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>
              Cancel
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleSavePosition}
              isLoading={saving}
            >
              Save Position
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Route History Modal */}
      <Modal isOpen={routeModal.isOpen} onClose={routeModal.onClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            Route History
            {selectedVehicleId && (() => {
              const v = vehicles.find((v) => v.vehicleId === selectedVehicleId);
              return v ? ` - ${v.vehicleName}` : "";
            })()}
          </ModalHeader>
          <ModalBody>
            {loadingRoute ? (
              <div className="flex items-center justify-center py-10">
                <Spinner size="lg" />
              </div>
            ) : (
              <RoutePlayback gpsLogs={routeHistory} />
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={routeModal.onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
