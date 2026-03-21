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
  History,
  Fuel,
  Thermometer,
  Wifi,
} from "lucide-react";
import VehicleMap from "@/modules/tms/components/vehicleMap";
import RoutePlayback from "@/modules/tms/components/routePlayback";
import Loading from "@/components/ui/loading";
import type { TrackingViewProps } from "@/modules/tms/types";

const statusColors: Record<string, "success" | "warning" | "danger" | "default"> = {
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
  selectedDate,
  handleDateChange,
}: TrackingViewProps) {
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
                className={`shrink-0 w-72 cursor-pointer ${isSelected ? "border-2 border-primary" : "border border-border"}`}
                onClick={() => setSelectedVehicleId(vehicle.tmsVehicleId)}
              >
                <CardBody className="p-4 gap-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {vehicle.tmsVehicleName || vehicle.tmsVehiclePlateNumber}
                      </p>
                      {vehicle.tmsVehicleName && (
                        <p className="text-xs text-muted-foreground">
                          {vehicle.tmsVehiclePlateNumber}
                        </p>
                      )}
                    </div>
                    <Chip
                      variant="flat"
                      size="sm"
                      color={
                        statusColors[vehicle.tmsVehicleStatus] || "default"
                      }
                    >
                      {vehicle.tmsVehicleStatus}
                    </Chip>
                  </div>

                  {pos ? (
                    <div className="flex flex-col gap-2 text-xs">
                      {/* Location */}
                      <div className="flex items-start gap-1.5">
                        <MapPin size={13} className="text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="font-mono text-xs">
                            {Number(pos.tmsGpsLogLatitude).toFixed(5)}, {Number(pos.tmsGpsLogLongitude).toFixed(5)}
                          </p>
                          {pos.ftAddress && (
                            <p className="text-muted-foreground truncate" title={pos.ftAddress}>
                              {pos.ftAddress}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Vehicle status grid */}
                      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs bg-default-50 rounded-lg px-2.5 py-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground/70">ความเร็ว</p>
                          <p className="font-medium">{pos.tmsGpsLogSpeed ?? 0} km/h</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground/70">เครื่อง</p>
                          <p className={`font-medium ${pos.ftEngine === "ON" ? "text-success" : "text-danger"}`}>
                            {pos.ftEngine || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground/70">ไฟ</p>
                          <p className={`font-medium ${pos.ftPowerStatus === "ON" ? "text-success" : "text-danger"}`}>
                            {pos.ftPowerStatus || "-"}
                          </p>
                        </div>
                      </div>

                      {/* Sensor grid */}
                      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                        {pos.ftFuel != null && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Fuel size={11} className="shrink-0" />
                            <span>{pos.ftFuel}%</span>
                          </div>
                        )}
                        {pos.ftExternalBatt && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="text-[11px]">🔋</span>
                            <span>{pos.ftExternalBatt}V</span>
                          </div>
                        )}
                        {pos.ftTemperature != null && pos.ftTemperature !== 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Thermometer size={11} className="shrink-0" />
                            <span>{pos.ftTemperature}°C</span>
                          </div>
                        )}
                      </div>

                      {/* Signal status */}
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        {pos.ftGPS && (
                          <span>
                            GPS:{" "}
                            <span className={pos.ftGPS === "ON" ? "text-success font-medium" : "text-danger font-medium"}>
                              {pos.ftGPS}
                            </span>
                          </span>
                        )}
                        {pos.ftGPRS && (
                          <span className="flex items-center gap-0.5">
                            <Wifi size={11} />
                            <span className={pos.ftGPRS === "ON" ? "text-success font-medium" : "font-medium"}>
                              {pos.ftGPRS}
                            </span>
                          </span>
                        )}
                        {pos.ftPositionSource && (
                          <span className="text-muted-foreground/60">{pos.ftPositionSource}</span>
                        )}
                      </div>

                      {pos.ftDriver && (
                        <p className="text-muted-foreground text-[11px]">
                          👤 {pos.ftDriver}
                        </p>
                      )}

                      {/* Timestamp & Live */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/50">
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(pos.tmsGpsLogRecordedAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                        </p>
                        {pos.tmsGpsLogSource === "forthtrack" && (
                          <span className="text-[10px] text-primary flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
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
                      size="sm"
                      radius="md"
                      startContent={<History size={14} />}
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
                    updateField("tmsGpsLogVehicleId", String(Array.from(keys)[0] || ""))
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
          <ModalHeader className="flex flex-col gap-2">
            <div>
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
            </div>
            <input
              type="date"
              value={selectedDate}
              max={new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" })}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-sm font-normal border border-default-300 rounded-lg px-3 py-1.5 bg-default-100 focus:outline-none focus:ring-2 focus:ring-primary w-fit"
            />
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
