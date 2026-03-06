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
import VehicleMap from "@/modules/tms/components/VehicleMap";
import RoutePlayback from "@/modules/tms/components/RoutePlayback";

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
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">ติดตาม GPS</h2>
        <div className="flex gap-2">
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<RefreshCw size={16} />}
            onPress={loadData}
          >
            รีเฟรช
          </Button>
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Navigation size={16} />}
            onPress={() => handleOpenManualUpdate()}
          >
            อัปเดตตำแหน่ง
          </Button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Left Panel - Vehicle List */}
        <div className="w-80 flex-shrink-0 overflow-y-auto flex flex-col gap-2">
          {vehicles.map((vehicle) => {
            const pos = positions.find(
              (p) => p.tmsGpsLogVehicleId === vehicle.tmsVehicleId,
            );
            const isSelected = selectedVehicleId === vehicle.tmsVehicleId;
            return (
              <Card
                key={vehicle.tmsVehicleId}
                shadow="none"
                className={`cursor-pointer ${isSelected ? "border-2 border-primary" : "border border-border"}`}
                onClick={() => setSelectedVehicleId(vehicle.tmsVehicleId)}
              >
                <CardBody className="p-3 gap-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm">{vehicle.tmsVehicleName || vehicle.tmsVehiclePlateNumber}</h3>
                    <Chip
                      variant="bordered"
                      size="sm"
                      color={STATUS_COLORS[vehicle.tmsVehicleStatus] || "default"}
                    >
                      {vehicle.tmsVehicleStatus}
                    </Chip>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.tmsVehiclePlateNumber}
                  </p>
                  {pos ? (
                    <div className="flex flex-col gap-1 text-sm">
                      <p className="flex items-center gap-1">
                        <MapPin size={12} className="text-primary" />
                        {Number(pos.tmsGpsLogLatitude).toFixed(5)},{" "}
                        {Number(pos.tmsGpsLogLongitude).toFixed(5)}
                      </p>
                      {pos.tmsGpsLogSpeed && (
                        <p className="text-muted-foreground">
                          ความเร็ว: {pos.tmsGpsLogSpeed} km/h
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {new Date(pos.tmsGpsLogRecordedAt).toLocaleString("th-TH")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">ไม่มีข้อมูล GPS</p>
                  )}
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="bordered"
                      size="md"
                      radius="md"
                      onPress={() => handleOpenManualUpdate(vehicle)}
                      className="flex-1"
                    >
                      อัปเดต
                    </Button>
                    <Button
                      variant="bordered"
                      size="md"
                      radius="md"
                      startContent={<History size={12} />}
                      onPress={() => loadRouteHistory(vehicle.tmsVehicleId)}
                      isLoading={loadingRoute && selectedVehicleId === vehicle.tmsVehicleId}
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

        {/* Right Panel - Map */}
        <div className="flex-1 rounded-xl overflow-hidden border border-border" style={{ isolation: "isolate" }}>
          <VehicleMap
            positions={positions}
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            onVehicleClick={setSelectedVehicleId}
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        รีเฟรชอัตโนมัติทุก 30 วินาที
      </p>

      {/* Manual Update Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            อัปเดตตำแหน่งยานพาหนะ
            {selectedVehicle && ` - ${selectedVehicle.tmsVehicleName || selectedVehicle.tmsVehiclePlateNumber}`}
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
                    formData.tmsGpsLogVehicleId ? [formData.tmsGpsLogVehicleId] : []
                  }
                  onSelectionChange={(keys) =>
                    updateField("tmsGpsLogVehicleId", Array.from(keys)[0] || "")
                  }
                  isRequired
                >
                  {vehicles.map((v) => (
                    <SelectItem key={v.tmsVehicleId} textValue={v.tmsVehicleName ? `${v.tmsVehicleName} (${v.tmsVehiclePlateNumber})` : v.tmsVehiclePlateNumber}>
                      {v.tmsVehicleName ? `${v.tmsVehicleName} (${v.tmsVehiclePlateNumber})` : v.tmsVehiclePlateNumber}
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
                onChange={(e) => updateField("tmsGpsLogLatitude", e.target.value)}
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
                onChange={(e) => updateField("tmsGpsLogLongitude", e.target.value)}
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

      {/* Route History Modal */}
      <Modal isOpen={routeModal.isOpen} onClose={routeModal.onClose} size="4xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            ประวัติเส้นทาง
            {selectedVehicleId && (() => {
              const v = vehicles.find((v) => v.tmsVehicleId === selectedVehicleId);
              return v ? ` - ${v.tmsVehicleName || v.tmsVehiclePlateNumber}` : "";
            })()}
          </ModalHeader>
          <ModalBody>
            {loadingRoute ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : (
              <RoutePlayback gpsLogs={routeHistory} />
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={routeModal.onClose}>
              ปิด
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
