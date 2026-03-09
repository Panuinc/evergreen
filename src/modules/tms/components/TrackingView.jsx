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
} from "@heroui/react";
import {
  MapPin,
  RefreshCw,
  Navigation,
  History,
  Fuel,
  Thermometer,
  Wifi,
} from "lucide-react";
import VehicleMap from "@/modules/tms/components/VehicleMap";
import RoutePlayback from "@/modules/tms/components/RoutePlayback";
import Loading from "@/components/ui/Loading";

const STATUS_COLORS = {
  available: "success",
  in_use: "warning",
  maintenance: "danger",
  retired: "default",
};

export default function TrackingView({
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
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-light">ติดตาม GPS</p>
        <div className="flex gap-2">
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<RefreshCw />}
            onPress={loadData}
          >
            รีเฟรช
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 shrink-0">
          {vehicles.map((vehicle) => {
            const pos = positions.find(
              (p) => p.tmsGpsLogVehicleId === vehicle.tmsVehicleId,
            );
            const isSelected = selectedVehicleId === vehicle.tmsVehicleId;
            return (
              <Card
                key={vehicle.tmsVehicleId}
                shadow="none"
                className={`cursor-pointer shrink-0 w-64 ${isSelected ? "border-2 border-primary" : "border border-border"}`}
                onClick={() => setSelectedVehicleId(vehicle.tmsVehicleId)}
              >
                <CardBody className="p-3 gap-2">
                  <div className="flex items-center justify-between">
                    <p className="font-light text-xs">
                      {vehicle.tmsVehicleName || vehicle.tmsVehiclePlateNumber}
                    </p>
                    <Chip
                      variant="flat"
                      size="md"
                      color={
                        STATUS_COLORS[vehicle.tmsVehicleStatus] || "default"
                      }
                    >
                      {vehicle.tmsVehicleStatus}
                    </Chip>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {vehicle.tmsVehiclePlateNumber}
                  </p>
                  {pos ? (
                    <div className="flex flex-col gap-1 text-xs">
                      {/* Location */}
                      <p className="flex items-center gap-1">
                        <MapPin size={12} className="text-primary shrink-0" />
                        {Number(pos.tmsGpsLogLatitude).toFixed(5)},{" "}
                        {Number(pos.tmsGpsLogLongitude).toFixed(5)}
                      </p>
                      {pos.ftAddress && (
                        <p
                          className="text-muted-foreground truncate"
                          title={pos.ftAddress}
                        >
                          {pos.ftAddress}
                        </p>
                      )}
                      {pos.ftPoi && (
                        <p className="text-muted-foreground">📍 {pos.ftPoi}</p>
                      )}
                      {/* Status row */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                        {pos.tmsGpsLogSpeed != null && (
                          <span>🚗 {pos.tmsGpsLogSpeed} km/h</span>
                        )}
                        {pos.ftEngine && (
                          <span>
                            เครื่อง:{" "}
                            <span
                              className={
                                pos.ftEngine === "ON"
                                  ? "text-success"
                                  : "text-danger"
                              }
                            >
                              {pos.ftEngine}
                            </span>
                          </span>
                        )}
                        {pos.ftPowerStatus && (
                          <span
                            className={
                              pos.ftPowerStatus === "ON"
                                ? "text-success"
                                : "text-muted-foreground"
                            }
                          >
                            ⚡ {pos.ftPowerStatus}
                          </span>
                        )}
                      </div>
                      {/* Sensor row */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                        {pos.ftFuel != null && (
                          <span className="flex items-center gap-0.5">
                            <Fuel size={10} /> {pos.ftFuel}%
                          </span>
                        )}
                        {pos.ftTemperature != null &&
                          pos.ftTemperature !== 0 && (
                            <span className="flex items-center gap-0.5">
                              <Thermometer size={10} /> {pos.ftTemperature}°C
                            </span>
                          )}
                        {pos.ftExternalBatt && (
                          <span>🔋 {pos.ftExternalBatt}V</span>
                        )}
                      </div>
                      {/* Signal row */}
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground">
                        {pos.ftGPS && (
                          <span
                            className={
                              pos.ftGPS === "ON"
                                ? "text-success"
                                : "text-danger"
                            }
                          >
                            GPS: {pos.ftGPS}
                          </span>
                        )}
                        {pos.ftGPRS && (
                          <span className="flex items-center gap-0.5">
                            <Wifi size={10} /> {pos.ftGPRS}
                          </span>
                        )}
                        {pos.ftPositionSource && (
                          <span className="text-muted-foreground/60">
                            {pos.ftPositionSource}
                          </span>
                        )}
                      </div>
                      {pos.ftDriver && (
                        <p className="text-muted-foreground">
                          👤 {pos.ftDriver}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {new Date(pos.tmsGpsLogRecordedAt).toLocaleString(
                          "th-TH",
                        )}
                      </p>
                      {pos.tmsGpsLogSource === "forthtrack" && (
                        <p className="text-[10px] text-primary/60">
                          ● Live GPS
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      ไม่มีข้อมูล GPS
                    </p>
                  )}
                  <div
                    className="flex gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="bordered"
                      size="md"
                      radius="md"
                      startContent={<History />}
                      onPress={() => loadRouteHistory(vehicle.tmsVehicleId)}
                      isLoading={
                        loadingRoute &&
                        selectedVehicleId === vehicle.tmsVehicleId
                      }
                      className="flex-1"
                    >
                      ประวัติ
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {}
        <div
          className="flex-1 rounded-xl overflow-hidden border border-border"
          style={{ isolation: "isolate" }}
        >
          <VehicleMap
            positions={positions}
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleClick={setSelectedVehicleId}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        รีเฟรชอัตโนมัติทุก 30 วินาที
      </p>

      {}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            อัปเดตตำแหน่งยานพาหนะ
            {selectedVehicle &&
              ` - ${selectedVehicle.tmsVehicleName || selectedVehicle.tmsVehiclePlateNumber}`}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              {!selectedVehicle && (
                <Select
                  label="ยานพาหนะ"
                  labelPlacement="outside"
                  placeholder="เลือกยานพาหนะ"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={
                    formData.tmsGpsLogVehicleId
                      ? [formData.tmsGpsLogVehicleId]
                      : []
                  }
                  onSelectionChange={(keys) =>
                    updateField("tmsGpsLogVehicleId", Array.from(keys)[0] || "")
                  }
                  isRequired
                >
                  {vehicles.map((v) => (
                    <SelectItem
                      key={v.tmsVehicleId}
                      textValue={
                        v.tmsVehicleName
                          ? `${v.tmsVehicleName} (${v.tmsVehiclePlateNumber})`
                          : v.tmsVehiclePlateNumber
                      }
                    >
                      {v.tmsVehicleName
                        ? `${v.tmsVehicleName} (${v.tmsVehiclePlateNumber})`
                        : v.tmsVehiclePlateNumber}
                    </SelectItem>
                  ))}
                </Select>
              )}
              <Input
                type="number"
                label="ละติจูด"
                labelPlacement="outside"
                placeholder="e.g. 13.7563"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.tmsGpsLogLatitude}
                onChange={(e) =>
                  updateField("tmsGpsLogLatitude", e.target.value)
                }
                isRequired
                isInvalid={!!validationErrors?.tmsGpsLogLatitude}
                errorMessage={validationErrors?.tmsGpsLogLatitude}
              />
              <Input
                type="number"
                label="ลองจิจูด"
                labelPlacement="outside"
                placeholder="e.g. 100.5018"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.tmsGpsLogLongitude}
                onChange={(e) =>
                  updateField("tmsGpsLogLongitude", e.target.value)
                }
                isRequired
                isInvalid={!!validationErrors?.tmsGpsLogLongitude}
                errorMessage={validationErrors?.tmsGpsLogLongitude}
              />
              <Input
                type="number"
                label="ความเร็ว (km/h)"
                labelPlacement="outside"
                placeholder="ไม่บังคับ"
                variant="bordered"
                size="md"
                radius="md"
                value={formData.tmsGpsLogSpeed}
                onChange={(e) => updateField("tmsGpsLogSpeed", e.target.value)}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={onClose}>
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleSavePosition}
              isLoading={saving}
            >
              บันทึกตำแหน่ง
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {}
      <Modal
        isOpen={routeModal.isOpen}
        onClose={routeModal.onClose}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            ประวัติเส้นทาง
            {selectedVehicleId &&
              (() => {
                const v = vehicles.find(
                  (v) => v.tmsVehicleId === selectedVehicleId,
                );
                return v
                  ? ` - ${v.tmsVehicleName || v.tmsVehiclePlateNumber}`
                  : "";
              })()}
          </ModalHeader>
          <ModalBody>
            {loadingRoute ? (
              <div className="flex items-center justify-center py-10">
                <Loading />
              </div>
            ) : (
              <RoutePlayback gpsLogs={routeHistory} />
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={routeModal.onClose}
            >
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
