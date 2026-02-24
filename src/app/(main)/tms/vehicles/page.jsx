"use client";

import { useCallback } from "react";
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
} from "@heroui/react";
import { Plus, Edit, Trash2, Download } from "lucide-react";
import { useVehicles } from "@/hooks/tms/useVehicles";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";

const vehicleCsvColumns = [
  { header: "ทะเบียนรถ", key: "vehiclePlateNumber" },
  { header: "ชื่อ", key: "vehicleName" },
  { header: "ประเภท", key: "vehicleType" },
  { header: "ยี่ห้อ", key: "vehicleBrand" },
  { header: "รุ่น", key: "vehicleModel" },
  { header: "ชนิดเชื้อเพลิง", key: "vehicleFuelType" },
  { header: "น้ำหนักบรรทุก (กก.)", key: "vehicleCapacityKg" },
  { header: "เลขไมล์", key: "vehicleCurrentMileage" },
  { header: "สถานะ", key: "vehicleStatus" },
];

const columns = [
  { name: "ชื่อ", uid: "vehicleName", sortable: true },
  { name: "ทะเบียนรถ", uid: "vehiclePlateNumber", sortable: true },
  { name: "ประเภท", uid: "vehicleType", sortable: true },
  { name: "ยี่ห้อ", uid: "vehicleBrand", sortable: true },
  { name: "สถานะ", uid: "vehicleStatus", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "พร้อมใช้งาน", uid: "available" },
  { name: "กำลังใช้งาน", uid: "in_use" },
  { name: "ซ่อมบำรุง", uid: "maintenance" },
  { name: "ปลดระวาง", uid: "retired" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "vehicleName",
  "vehiclePlateNumber",
  "vehicleType",
  "vehicleBrand",
  "vehicleStatus",
  "actions",
];

export default function VehiclesPage() {
  const {
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
  } = useVehicles();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "vehicleName":
          return <span className="font-medium">{item.vehicleName}</span>;
        case "vehiclePlateNumber":
          return (
            <span className="text-default-500">
              {item.vehiclePlateNumber || "-"}
            </span>
          );
        case "vehicleType":
          return item.vehicleType || "-";
        case "vehicleBrand":
          return item.vehicleBrand || "-";
        case "vehicleStatus": {
          const colorMap = {
            available: "success",
            in_use: "warning",
            maintenance: "danger",
            retired: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.vehicleStatus] || "default"}
            >
              {item.vehicleStatus}
            </Chip>
          );
        }
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
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(item)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return item[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={vehicles}
        renderCell={renderCell}
        enableCardView
        rowKey="vehicleId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยทะเบียน, ชื่อ, ยี่ห้อ, รุ่น..."
        searchKeys={[
          "vehiclePlateNumber",
          "vehicleName",
          "vehicleBrand",
          "vehicleModel",
        ]}
        statusField="vehicleStatus"
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
                    value={formData.vehiclePlateNumber}
                    onChange={(e) =>
                      updateField("vehiclePlateNumber", e.target.value)
                    }
                    isRequired
                    isInvalid={!!validationErrors?.vehiclePlateNumber}
                    errorMessage={validationErrors?.vehiclePlateNumber}
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
                    value={formData.vehicleName}
                    onChange={(e) =>
                      updateField("vehicleName", e.target.value)
                    }
                    isInvalid={!!validationErrors?.vehicleName}
                    errorMessage={validationErrors?.vehicleName}
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
                      formData.vehicleType ? [formData.vehicleType] : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("vehicleType", val);
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
                    value={formData.vehicleBrand}
                    onChange={(e) =>
                      updateField("vehicleBrand", e.target.value)
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
                    value={formData.vehicleModel}
                    onChange={(e) =>
                      updateField("vehicleModel", e.target.value)
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
                    value={formData.vehicleYear}
                    onChange={(e) =>
                      updateField("vehicleYear", e.target.value)
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
                    value={formData.vehicleColor}
                    onChange={(e) =>
                      updateField("vehicleColor", e.target.value)
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
                    value={formData.vehicleVin}
                    onChange={(e) =>
                      updateField("vehicleVin", e.target.value)
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
                      formData.vehicleFuelType
                        ? [formData.vehicleFuelType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("vehicleFuelType", val);
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
                    value={formData.vehicleCapacity}
                    onChange={(e) =>
                      updateField("vehicleCapacity", e.target.value)
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
                    value={formData.vehicleMileage}
                    onChange={(e) =>
                      updateField("vehicleMileage", e.target.value)
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
                    value={formData.vehicleRegistrationExpiry}
                    onChange={(e) =>
                      updateField("vehicleRegistrationExpiry", e.target.value)
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
                    value={formData.vehicleInsuranceExpiry}
                    onChange={(e) =>
                      updateField("vehicleInsuranceExpiry", e.target.value)
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
                    value={formData.vehicleActExpiry}
                    onChange={(e) =>
                      updateField("vehicleActExpiry", e.target.value)
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
                    selectedKeys={[formData.vehicleStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "available";
                      updateField("vehicleStatus", val);
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
                  value={formData.vehicleNotes}
                  onChange={(e) =>
                    updateField("vehicleNotes", e.target.value)
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
                {deletingVehicle?.vehicleName} ({deletingVehicle?.vehiclePlateNumber})
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
