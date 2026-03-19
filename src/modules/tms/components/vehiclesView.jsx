import { useCallback, useMemo } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem,
  Chip,
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, Download, Power } from "lucide-react";
import DataTable from "@/components/ui/dataTable";
import { exportToCsv } from "@/lib/exportCsv";
import { useRBAC } from "@/contexts/rbacContext";

const vehicleCsvColumns = [
  { header: "ทะเบียนรถ", key: "tmsVehiclePlateNumber" },
  { header: "ความกว้าง (ซม.)", key: "tmsVehicleWidth" },
  { header: "ความยาว (ซม.)", key: "tmsVehicleLength" },
  { header: "ความสูง (ซม.)", key: "tmsVehicleHeight" },
  { header: "น้ำหนักบรรทุก (ตัน)", key: "tmsVehicleCapacityKg" },
  { header: "ชนิดเชื้อเพลิง", key: "tmsVehicleFuelType" },
  { header: "อัตราสิ้นเปลือง (กม./ล.)", key: "tmsVehicleFuelConsumptionRate" },
  { header: "สถานะ", key: "tmsVehicleStatus" },
];

const baseColumns = [
  { name: "ทะเบียนรถ", uid: "tmsVehiclePlateNumber", sortable: true },
  { name: "ขนาดบรรทุก", uid: "dimensions" },
  { name: "น้ำหนักบรรทุก (ตัน)", uid: "tmsVehicleCapacityKg", sortable: true },
  { name: "เชื้อเพลิง", uid: "tmsVehicleFuelType" },
  { name: "กม./ลิตร", uid: "tmsVehicleFuelConsumptionRate", sortable: true },
  { name: "สถานะ", uid: "tmsVehicleStatus", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "พร้อมใช้งาน", uid: "available" },
  { name: "กำลังใช้งาน", uid: "in_use" },
  { name: "ซ่อมบำรุง", uid: "maintenance" },
  { name: "ปลดระวาง", uid: "retired" },
];

const statusColors = {
  available: "success",
  in_use: "warning",
  maintenance: "danger",
  retired: "default",
};

const fuelLabels = {
  diesel: "ดีเซล",
  gasoline: "เบนซิน",
  ngv: "NGV",
  electric: "ไฟฟ้า",
};

const baseVisibleColumns = [
  "tmsVehiclePlateNumber",
  "dimensions",
  "tmsVehicleCapacityKg",
  "tmsVehicleFuelType",
  "tmsVehicleFuelConsumptionRate",
  "tmsVehicleStatus",
  "actions",
];

export default function VehiclesView({
  vehicles,
  loading,
  saving,
  editingVehicle,
  formData,
  validationErrors,
  deletingVehicle,
  isOpen,
  onClose,
  deleteModal,
  updateField,
  handleOpen,
  handleSave,
  confirmDelete,
  handleDelete,
  toggleActive,
}) {
  const { isSuperAdmin } = useRBAC();

  const initialVisibleColumns = useMemo(() => {
    if (isSuperAdmin) {
      return [...baseVisibleColumns, "isActive"];
    }
    return baseVisibleColumns;
  }, [isSuperAdmin]);

  const columns = useMemo(() => {
    if (isSuperAdmin) {
      const actionsCol = baseColumns[baseColumns.length - 1];
      return [
        ...baseColumns.slice(0, -1),
        { name: "สถานะใช้งาน", uid: "isActive" },
        actionsCol,
      ];
    }
    return baseColumns;
  }, [isSuperAdmin]);

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "tmsVehiclePlateNumber":
          return <span className="font-light">{item.tmsVehiclePlateNumber || "-"}</span>;
        case "dimensions": {
          const w = item.tmsVehicleWidth;
          const l = item.tmsVehicleLength;
          const h = item.tmsVehicleHeight;
          if (!w && !l && !h) return "-";
          return `${w || "-"} x ${l || "-"} x ${h || "-"} ซม.`;
        }
        case "tmsVehicleCapacityKg":
          return item.tmsVehicleCapacityKg ? `${item.tmsVehicleCapacityKg} ตัน` : "-";
        case "tmsVehicleFuelType":
          return fuelLabels[item.tmsVehicleFuelType] || item.tmsVehicleFuelType || "-";
        case "tmsVehicleFuelConsumptionRate":
          return item.tmsVehicleFuelConsumptionRate ? `${item.tmsVehicleFuelConsumptionRate}` : "-";
        case "tmsVehicleStatus":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={statusColors[item.tmsVehicleStatus] || "default"}
            >
              {statusOptions.find((s) => s.uid === item.tmsVehicleStatus)?.name || item.tmsVehicleStatus}
            </Chip>
          );
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={item.isActive ? "success" : "danger"}
            >
              {item.isActive ? "Active" : "Inactive"}
            </Chip>
          );
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(item)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={item.isActive}
                  onValueChange={() => toggleActive(item)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => confirmDelete(item)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return item[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete, toggleActive, isSuperAdmin],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={vehicles}
        renderCell={renderCell}
        enableCardView
        rowKey="tmsVehicleId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาด้วยทะเบียน..."
        searchKeys={["tmsVehiclePlateNumber"]}
        statusField="tmsVehicleStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบยานพาหนะ"
        topEndContent={
          <div className="flex gap-2">
            <Button variant="bordered" size="md" radius="md" startContent={<Download />} onPress={() => exportToCsv("vehicles.csv", vehicleCsvColumns, vehicles)}>
              ส่งออก
            </Button>
            <Button variant="bordered" size="md" radius="md" startContent={<Plus />} onPress={() => handleOpen()}>
              เพิ่มยานพาหนะ
            </Button>
          </div>
        }
        actionMenuItems={(item) => [
          { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => handleOpen(item) },
          isSuperAdmin
            ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power />, onPress: () => toggleActive(item) }
            : { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => confirmDelete(item) },
        ].filter(Boolean)}
      />

      {}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {editingVehicle ? "แก้ไขยานพาหนะ" : "เพิ่มยานพาหนะ"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-4">
              {}
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="ทะเบียนรถ"
                  labelPlacement="outside"
                  placeholder="กรอกทะเบียนรถ"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.tmsVehiclePlateNumber}
                  onChange={(e) =>
                    updateField("tmsVehiclePlateNumber", e.target.value)
                  }
                  isRequired
                  isInvalid={!!validationErrors?.tmsVehiclePlateNumber}
                  errorMessage={validationErrors?.tmsVehiclePlateNumber}
                />
              </div>

              {}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-light px-2">ความจุที่สามารถบรรทุกได้</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center w-full h-fit p-2 gap-2">
                    <Input
                      type="number"
                      label="ความกว้าง (ซม.)"
                      labelPlacement="outside"
                      placeholder="กว้าง"
                      variant="bordered"
                      size="md"
                      radius="md"
                      value={formData.tmsVehicleWidth}
                      onChange={(e) =>
                        updateField("tmsVehicleWidth", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center w-full h-fit p-2 gap-2">
                    <Input
                      type="number"
                      label="ความยาว (ซม.)"
                      labelPlacement="outside"
                      placeholder="ยาว"
                      variant="bordered"
                      size="md"
                      radius="md"
                      value={formData.tmsVehicleLength}
                      onChange={(e) =>
                        updateField("tmsVehicleLength", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center w-full h-fit p-2 gap-2">
                    <Input
                      type="number"
                      label="ความสูง (ซม.)"
                      labelPlacement="outside"
                      placeholder="สูง"
                      variant="bordered"
                      size="md"
                      radius="md"
                      value={formData.tmsVehicleHeight}
                      onChange={(e) =>
                        updateField("tmsVehicleHeight", e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center w-full h-fit p-2 gap-2">
                    <Input
                      type="number"
                      label="น้ำหนัก (ตัน)"
                      labelPlacement="outside"
                      placeholder="น้ำหนักบรรทุก"
                      variant="bordered"
                      size="md"
                      radius="md"
                      value={formData.tmsVehicleCapacityKg}
                      onChange={(e) =>
                        updateField("tmsVehicleCapacityKg", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ชนิดเชื้อเพลิง"
                    labelPlacement="outside"
                    placeholder="เลือกชนิดเชื้อเพลิง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.tmsVehicleFuelType
                        ? [formData.tmsVehicleFuelType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("tmsVehicleFuelType", val);
                    }}
                  >
                    <SelectItem key="diesel">ดีเซล</SelectItem>
                    <SelectItem key="gasoline">เบนซิน</SelectItem>
                    <SelectItem key="ngv">NGV</SelectItem>
                    <SelectItem key="electric">ไฟฟ้า</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="อัตราการกินน้ำมัน (กม./ลิตร)"
                    labelPlacement="outside"
                    placeholder="กรอกอัตราการกินน้ำมัน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleFuelConsumptionRate}
                    onChange={(e) =>
                      updateField("tmsVehicleFuelConsumptionRate", e.target.value)
                    }
                  />
                </div>
              </div>

              {}
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Forth Track GPS ID"
                  labelPlacement="outside"
                  placeholder="กรอก gpsID จาก Forth Track (เช่น 505649)"
                  description="ดูได้จากข้อมูล Forth Track → ช่อง gpsID"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.tmsVehicleForthtrackId}
                  onChange={(e) => updateField("tmsVehicleForthtrackId", e.target.value)}
                />
              </div>

              {}
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Select
                  label="สถานะ"
                  labelPlacement="outside"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={[formData.tmsVehicleStatus]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] || "available";
                    updateField("tmsVehicleStatus", val);
                  }}
                >
                  <SelectItem key="available">พร้อมใช้งาน</SelectItem>
                  <SelectItem key="in_use">กำลังใช้งาน</SelectItem>
                  <SelectItem key="maintenance">ซ่อมบำรุง</SelectItem>
                  <SelectItem key="retired">ปลดระวาง</SelectItem>
                </Select>
              </div>
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
              onPress={handleSave}
              isLoading={saving}
            >
              {editingVehicle ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบยานพาหนะ</ModalHeader>
          <ModalBody>
            <p>
              คุณต้องการลบ{" "}
              <span className="font-light">
                {deletingVehicle?.tmsVehiclePlateNumber}
              </span>
              {" "}หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={deleteModal.onClose}
            >
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={handleDelete}
            >
              ลบ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
