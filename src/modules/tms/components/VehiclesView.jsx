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
import { Plus, Edit, Trash2, Download } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";
import { useRBAC } from "@/contexts/RBACContext";

const vehicleCsvColumns = [
  { header: "ทะเบียนรถ", key: "tmsVehiclePlateNumber" },
  { header: "ชื่อ", key: "tmsVehicleName" },
  { header: "ประเภท", key: "tmsVehicleType" },
  { header: "ยี่ห้อ", key: "tmsVehicleBrand" },
  { header: "รุ่น", key: "tmsVehicleModel" },
  { header: "ชนิดเชื้อเพลิง", key: "tmsVehicleFuelType" },
  { header: "น้ำหนักบรรทุก (กก.)", key: "tmsVehicleCapacityKg" },
  { header: "เลขไมล์", key: "tmsVehicleCurrentMileage" },
  { header: "สถานะ", key: "tmsVehicleStatus" },
];

const baseColumns = [
  { name: "ชื่อ", uid: "tmsVehicleName", sortable: true },
  { name: "ทะเบียนรถ", uid: "tmsVehiclePlateNumber", sortable: true },
  { name: "ประเภท", uid: "tmsVehicleType", sortable: true },
  { name: "ยี่ห้อ", uid: "tmsVehicleBrand", sortable: true },
  { name: "สถานะ", uid: "tmsVehicleStatus", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "พร้อมใช้งาน", uid: "available" },
  { name: "กำลังใช้งาน", uid: "in_use" },
  { name: "ซ่อมบำรุง", uid: "maintenance" },
  { name: "ปลดระวาง", uid: "retired" },
];

const STATUS_COLORS = {
  available: "success",
  in_use: "warning",
  maintenance: "danger",
  retired: "default",
};

const BASE_VISIBLE_COLUMNS = [
  "tmsVehicleName",
  "tmsVehiclePlateNumber",
  "tmsVehicleType",
  "tmsVehicleBrand",
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
      return [...BASE_VISIBLE_COLUMNS, "isActive"];
    }
    return BASE_VISIBLE_COLUMNS;
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
        case "tmsVehicleName":
          return <span className="font-medium">{item.tmsVehicleName}</span>;
        case "tmsVehiclePlateNumber":
          return (
            <span className="text-default-500">
              {item.tmsVehiclePlateNumber || "-"}
            </span>
          );
        case "tmsVehicleType":
          return item.tmsVehicleType || "-";
        case "tmsVehicleBrand":
          return item.tmsVehicleBrand || "-";
        case "tmsVehicleStatus":
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={STATUS_COLORS[item.tmsVehicleStatus] || "default"}
            >
              {item.tmsVehicleStatus}
            </Chip>
          );
        case "isActive":
          return (
            <Chip
              variant="bordered"
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
                  size="sm"
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
        searchPlaceholder="ค้นหาด้วยทะเบียน, ชื่อ, ยี่ห้อ, รุ่น..."
        searchKeys={[
          "tmsVehiclePlateNumber",
          "tmsVehicleName",
          "tmsVehicleBrand",
          "tmsVehicleModel",
        ]}
        statusField="tmsVehicleStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบยานพาหนะ"
        topEndContent={
          <div className="flex gap-2">
            <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={() => exportToCsv("vehicles.csv", vehicleCsvColumns, vehicles)}>
              ส่งออก
            </Button>
            <Button variant="bordered" size="md" radius="md" startContent={<Plus />} onPress={() => handleOpen()}>
              เพิ่มยานพาหนะ
            </Button>
          </div>
        }
      />

      {/* Create/Edit Modal */}
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
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อ"
                    labelPlacement="outside"
                    placeholder="กรอกชื่อยานพาหนะ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleName}
                    onChange={(e) =>
                      updateField("tmsVehicleName", e.target.value)
                    }
                    isInvalid={!!validationErrors?.tmsVehicleName}
                    errorMessage={validationErrors?.tmsVehicleName}
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ประเภท"
                    labelPlacement="outside"
                    placeholder="เลือกประเภท"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.tmsVehicleType ? [formData.tmsVehicleType] : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("tmsVehicleType", val);
                    }}
                  >
                    <SelectItem key="truck">รถบรรทุก</SelectItem>
                    <SelectItem key="pickup">รถกระบะ</SelectItem>
                    <SelectItem key="van">รถตู้</SelectItem>
                    <SelectItem key="trailer">รถพ่วง</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ยี่ห้อ"
                    labelPlacement="outside"
                    placeholder="กรอกยี่ห้อ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleBrand}
                    onChange={(e) =>
                      updateField("tmsVehicleBrand", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="รุ่น"
                    labelPlacement="outside"
                    placeholder="กรอกรุ่น"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleModel}
                    onChange={(e) =>
                      updateField("tmsVehicleModel", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ปี"
                    labelPlacement="outside"
                    placeholder="กรอกปี"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleYear}
                    onChange={(e) =>
                      updateField("tmsVehicleYear", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="สี"
                    labelPlacement="outside"
                    placeholder="กรอกสี"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleColor}
                    onChange={(e) =>
                      updateField("tmsVehicleColor", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="เลข VIN"
                    labelPlacement="outside"
                    placeholder="กรอกเลข VIN"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleVin}
                    onChange={(e) =>
                      updateField("tmsVehicleVin", e.target.value)
                    }
                  />
                </div>
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
                    label="น้ำหนักบรรทุก (กก.)"
                    labelPlacement="outside"
                    placeholder="กรอกน้ำหนักบรรทุก"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleCapacity}
                    onChange={(e) =>
                      updateField("tmsVehicleCapacity", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="เลขไมล์ปัจจุบัน"
                    labelPlacement="outside"
                    placeholder="กรอกเลขไมล์ปัจจุบัน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleMileage}
                    onChange={(e) =>
                      updateField("tmsVehicleMileage", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันหมดอายุทะเบียน"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleRegistrationExpiry}
                    onChange={(e) =>
                      updateField("tmsVehicleRegistrationExpiry", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันหมดอายุประกันภัย"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleInsuranceExpiry}
                    onChange={(e) =>
                      updateField("tmsVehicleInsuranceExpiry", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันหมดอายุ พ.ร.บ."
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.tmsVehicleActExpiry}
                    onChange={(e) =>
                      updateField("tmsVehicleActExpiry", e.target.value)
                    }
                  />
                </div>
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
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="หมายเหตุ"
                  labelPlacement="outside"
                  placeholder="กรอกหมายเหตุ"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.tmsVehicleNotes}
                  onChange={(e) =>
                    updateField("tmsVehicleNotes", e.target.value)
                  }
                />
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบยานพาหนะ</ModalHeader>
          <ModalBody>
            <p>
              คุณต้องการลบ{" "}
              <span className="font-semibold">
                {deletingVehicle?.tmsVehicleName} ({deletingVehicle?.tmsVehiclePlateNumber})
              </span>
              หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
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
