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
import { useMaintenance } from "@/hooks/useMaintenance";
import DataTable from "@/components/ui/DataTable";
import { exportToCsv } from "@/lib/exportCsv";

const maintenanceCsvColumns = [
  { header: "วันที่", key: "maintenanceDate" },
  { header: "ประเภท", key: "maintenanceType" },
  { header: "รายละเอียด", key: "maintenanceDescription" },
  { header: "ค่าใช้จ่าย", key: "maintenanceCost" },
  { header: "ผู้ให้บริการ", key: "maintenanceVendor" },
  { header: "สถานะ", key: "maintenanceStatus" },
];

const columns = [
  { name: "วันที่", uid: "maintenanceDate", sortable: true },
  { name: "ยานพาหนะ", uid: "vehicleName", sortable: true },
  { name: "ประเภท", uid: "maintenanceType", sortable: true },
  { name: "รายละเอียด", uid: "maintenanceDescription" },
  { name: "ค่าใช้จ่าย", uid: "maintenanceCost", sortable: true },
  { name: "สถานะ", uid: "maintenanceStatus", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "นัดหมาย", uid: "scheduled" },
  { name: "กำลังดำเนินการ", uid: "in_progress" },
  { name: "เสร็จสิ้น", uid: "completed" },
  { name: "ยกเลิก", uid: "cancelled" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "maintenanceDate",
  "vehicleName",
  "maintenanceType",
  "maintenanceDescription",
  "maintenanceCost",
  "maintenanceStatus",
  "actions",
];

export default function MaintenancePage() {
  const {
    maintenance,
    vehicles,
    loading,
    saving,
    editingMaintenance,
    formData,
    deletingMaintenance,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useMaintenance();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "maintenanceDate":
          return (
            <span className="text-default-500">
              {item.maintenanceDate
                ? new Date(item.maintenanceDate).toLocaleDateString("th-TH")
                : "-"}
            </span>
          );
        case "vehicleName": {
          const vehicle = vehicles.find(
            (v) => v.vehicleId === item.maintenanceVehicleId,
          );
          return vehicle
            ? `${vehicle.vehicleName} (${vehicle.vehiclePlateNumber})`
            : "-";
        }
        case "maintenanceType":
          return item.maintenanceType
            ? item.maintenanceType.charAt(0).toUpperCase() +
                item.maintenanceType.slice(1).replace(/_/g, " ")
            : "-";
        case "maintenanceDescription":
          return (
            <span className="text-default-500">
              {item.maintenanceDescription || "-"}
            </span>
          );
        case "maintenanceCost":
          return item.maintenanceCost
            ? `฿${Number(item.maintenanceCost).toLocaleString()}`
            : "-";
        case "maintenanceStatus": {
          const colorMap = {
            scheduled: "primary",
            in_progress: "warning",
            completed: "success",
            cancelled: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.maintenanceStatus] || "default"}
            >
              {item.maintenanceStatus}
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
    [handleOpen, confirmDelete, vehicles],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={maintenance}
        renderCell={renderCell}
        enableCardView
        rowKey="maintenanceId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยรายละเอียด, ผู้ให้บริการ..."
        searchKeys={[
          "maintenanceDescription",
          "maintenanceVendor",
        ]}
        statusField="maintenanceStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบรายการซ่อมบำรุง"
        topEndContent={
          <div className="flex gap-2">
            <Button variant="bordered" size="md" radius="md" startContent={<Download size={16} />} onPress={() => exportToCsv("maintenance.csv", maintenanceCsvColumns, maintenance)}>
              ส่งออก
            </Button>
            <Button variant="bordered" size="md" radius="md" startContent={<Plus />} onPress={() => handleOpen()}>
              เพิ่มรายการซ่อมบำรุง
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
            {editingMaintenance ? "แก้ไขรายการซ่อมบำรุง" : "เพิ่มรายการซ่อมบำรุง"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ยานพาหนะ"
                    labelPlacement="outside"
                    placeholder="เลือกยานพาหนะ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.maintenanceVehicleId
                        ? [formData.maintenanceVehicleId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("maintenanceVehicleId", val);
                    }}
                    isRequired
                  >
                    {vehicles.map((v) => (
                      <SelectItem key={v.vehicleId}>
                        {v.vehicleName} ({v.vehiclePlateNumber})
                      </SelectItem>
                    ))}
                  </Select>
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
                      formData.maintenanceType
                        ? [formData.maintenanceType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("maintenanceType", val);
                    }}
                  >
                    <SelectItem key="preventive">ป้องกัน</SelectItem>
                    <SelectItem key="repair">ซ่อม</SelectItem>
                    <SelectItem key="inspection">ตรวจสภาพ</SelectItem>
                    <SelectItem key="tire">ยาง</SelectItem>
                    <SelectItem key="oil_change">เปลี่ยนถ่ายน้ำมัน</SelectItem>
                    <SelectItem key="other">อื่นๆ</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="รายละเอียด"
                    labelPlacement="outside"
                    placeholder="กรอกรายละเอียด"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceDescription}
                    onChange={(e) =>
                      updateField("maintenanceDescription", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันที่"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceDate}
                    onChange={(e) =>
                      updateField("maintenanceDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันที่เสร็จ"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceCompletedDate}
                    onChange={(e) =>
                      updateField("maintenanceCompletedDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="เลขไมล์"
                    labelPlacement="outside"
                    placeholder="กรอกเลขไมล์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceMileage}
                    onChange={(e) =>
                      updateField("maintenanceMileage", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="ค่าใช้จ่าย"
                    labelPlacement="outside"
                    placeholder="กรอกค่าใช้จ่าย"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceCost}
                    onChange={(e) =>
                      updateField("maintenanceCost", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้ให้บริการ"
                    labelPlacement="outside"
                    placeholder="กรอกผู้ให้บริการ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceVendor}
                    onChange={(e) =>
                      updateField("maintenanceVendor", e.target.value)
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
                    selectedKeys={[formData.maintenanceStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "scheduled";
                      updateField("maintenanceStatus", val);
                    }}
                  >
                    <SelectItem key="scheduled">นัดหมาย</SelectItem>
                    <SelectItem key="in_progress">กำลังดำเนินการ</SelectItem>
                    <SelectItem key="completed">เสร็จสิ้น</SelectItem>
                    <SelectItem key="cancelled">ยกเลิก</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันนัดครั้งถัดไป"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceNextDueDate}
                    onChange={(e) =>
                      updateField("maintenanceNextDueDate", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="เลขไมล์ครั้งถัดไป"
                    labelPlacement="outside"
                    placeholder="กรอกเลขไมล์ครั้งถัดไป"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.maintenanceNextDueMileage}
                    onChange={(e) =>
                      updateField("maintenanceNextDueMileage", e.target.value)
                    }
                  />
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
                  value={formData.maintenanceNotes}
                  onChange={(e) =>
                    updateField("maintenanceNotes", e.target.value)
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
              {editingMaintenance ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบรายการซ่อมบำรุง</ModalHeader>
          <ModalBody>
            <p>
              คุณต้องการลบรายการซ่อมบำรุงนี้
              {deletingMaintenance?.maintenanceDescription && (
                <>
                  {" "}
                  <span className="font-semibold">
                    ({deletingMaintenance.maintenanceDescription})
                  </span>
                </>
              )}
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
