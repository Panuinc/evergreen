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
import { Plus, Edit, Trash2 } from "lucide-react";
import { useDrivers } from "@/hooks/useDrivers";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อ", uid: "name", sortable: true },
  { name: "โทรศัพท์", uid: "driverPhone" },
  { name: "ตำแหน่ง", uid: "driverRole", sortable: true },
  { name: "ประเภทใบขับขี่", uid: "driverLicenseType", sortable: true },
  { name: "วันหมดอายุใบขับขี่", uid: "driverLicenseExpiry", sortable: true },
  { name: "สถานะ", uid: "driverStatus", sortable: true },
  { name: "จัดการ", uid: "actions" },
];

const statusOptions = [
  { name: "พร้อม", uid: "available" },
  { name: "ปฏิบัติงาน", uid: "on_duty" },
  { name: "ลา", uid: "on_leave" },
  { name: "ไม่ใช้งาน", uid: "inactive" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "driverPhone",
  "driverRole",
  "driverLicenseType",
  "driverLicenseExpiry",
  "driverStatus",
  "actions",
];

export default function DriversPage() {
  const {
    drivers,
    employees,
    loading,
    saving,
    editingDriver,
    formData,
    deletingDriver,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useDrivers();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "name":
          return (
            <span className="font-medium">
              {item.driverFirstName} {item.driverLastName}
            </span>
          );
        case "driverPhone":
          return (
            <span className="text-default-500">{item.driverPhone || "-"}</span>
          );
        case "driverRole": {
          const roleColor = {
            driver: "primary",
            assistant: "secondary",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={roleColor[item.driverRole] || "default"}
            >
              {item.driverRole}
            </Chip>
          );
        }
        case "driverLicenseType":
          return item.driverLicenseType || "-";
        case "driverLicenseExpiry":
          return (
            <span className="text-default-500">
              {item.driverLicenseExpiry
                ? new Date(item.driverLicenseExpiry).toLocaleDateString("th-TH")
                : "-"}
            </span>
          );
        case "driverStatus": {
          const colorMap = {
            available: "success",
            on_duty: "warning",
            on_leave: "danger",
            inactive: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.driverStatus] || "default"}
            >
              {item.driverStatus}
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
        data={drivers}
        renderCell={renderCell}
        enableCardView
        rowKey="driverId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยชื่อ, เบอร์โทร..."
        searchKeys={[
          "driverFirstName",
          "driverLastName",
          "driverPhone",
        ]}
        statusField="driverStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบพนักงานขับรถ"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มพนักงานขับรถ
          </Button>
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
            {editingDriver ? "แก้ไขพนักงานขับรถ" : "เพิ่มพนักงานขับรถ"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อ"
                    labelPlacement="outside"
                    placeholder="กรอกชื่อ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverFirstName}
                    onChange={(e) =>
                      updateField("driverFirstName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="นามสกุล"
                    labelPlacement="outside"
                    placeholder="กรอกนามสกุล"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverLastName}
                    onChange={(e) =>
                      updateField("driverLastName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="โทรศัพท์"
                    labelPlacement="outside"
                    placeholder="กรอกเบอร์โทรศัพท์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverPhone}
                    onChange={(e) =>
                      updateField("driverPhone", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ตำแหน่ง"
                    labelPlacement="outside"
                    placeholder="เลือกตำแหน่ง"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.driverRole ? [formData.driverRole] : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("driverRole", val);
                    }}
                  >
                    <SelectItem key="driver">พนักงานขับรถ</SelectItem>
                    <SelectItem key="assistant">ผู้ช่วย</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="เลขใบขับขี่"
                    labelPlacement="outside"
                    placeholder="กรอกเลขใบขับขี่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverLicenseNumber}
                    onChange={(e) =>
                      updateField("driverLicenseNumber", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ประเภทใบขับขี่"
                    labelPlacement="outside"
                    placeholder="เลือกประเภทใบขับขี่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.driverLicenseType
                        ? [formData.driverLicenseType]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("driverLicenseType", val);
                    }}
                  >
                    <SelectItem key="type1">Type 1</SelectItem>
                    <SelectItem key="type2">Type 2</SelectItem>
                    <SelectItem key="type3">Type 3</SelectItem>
                    <SelectItem key="type4">Type 4</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันหมดอายุใบขับขี่"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverLicenseExpiry}
                    onChange={(e) =>
                      updateField("driverLicenseExpiry", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="เชื่อมโยงพนักงาน"
                    labelPlacement="outside"
                    placeholder="เลือกพนักงาน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.driverEmployeeId
                        ? [formData.driverEmployeeId]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("driverEmployeeId", val);
                    }}
                  >
                    {employees.map((emp) => (
                      <SelectItem key={emp.employeeId}>
                        {emp.employeeFirstName} {emp.employeeLastName}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.driverStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "available";
                      updateField("driverStatus", val);
                    }}
                  >
                    <SelectItem key="available">พร้อม</SelectItem>
                    <SelectItem key="on_duty">ปฏิบัติงาน</SelectItem>
                    <SelectItem key="on_leave">ลา</SelectItem>
                    <SelectItem key="inactive">ไม่ใช้งาน</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="หมายเหตุ"
                    labelPlacement="outside"
                    placeholder="กรอกหมายเหตุ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.driverNotes}
                    onChange={(e) =>
                      updateField("driverNotes", e.target.value)
                    }
                  />
                </div>
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
              {editingDriver ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบพนักงานขับรถ</ModalHeader>
          <ModalBody>
            <p>
              คุณต้องการลบ{" "}
              <span className="font-semibold">
                {deletingDriver?.driverFirstName}{" "}
                {deletingDriver?.driverLastName}
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
