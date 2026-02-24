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
import { useItNetwork } from "@/hooks/it/useItNetwork";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่ออุปกรณ์", uid: "deviceName", sortable: true },
  { name: "ประเภท", uid: "deviceType", sortable: true },
  { name: "ที่อยู่ IP", uid: "deviceIpAddress" },
  { name: "ที่อยู่ MAC", uid: "deviceMacAddress" },
  { name: "สถานที่", uid: "deviceLocation" },
  { name: "ผู้ผลิต", uid: "deviceManufacturer" },
  { name: "สถานะ", uid: "deviceStatus", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "ออนไลน์", uid: "online" },
  { name: "ออฟไลน์", uid: "offline" },
  { name: "ซ่อมบำรุง", uid: "maintenance" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "deviceName",
  "deviceType",
  "deviceIpAddress",
  "deviceLocation",
  "deviceStatus",
  "actions",
];

export default function NetworkPage() {
  const {
    devices,
    loading,
    saving,
    editingDevice,
    formData,
    validationErrors,
    deletingDevice,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItNetwork();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "deviceName":
          return <span className="font-medium">{item.deviceName}</span>;
        case "deviceType":
          return item.deviceType || "-";
        case "deviceIpAddress":
          return <span className="text-default-500">{item.deviceIpAddress || "-"}</span>;
        case "deviceMacAddress":
          return <span className="text-default-500">{item.deviceMacAddress || "-"}</span>;
        case "deviceLocation":
          return item.deviceLocation || "-";
        case "deviceManufacturer":
          return item.deviceManufacturer || "-";
        case "deviceStatus": {
          const colorMap = {
            online: "success",
            offline: "danger",
            maintenance: "warning",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.deviceStatus] || "default"}
            >
              {item.deviceStatus}
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
        data={devices}
        renderCell={renderCell}
        enableCardView
        rowKey="deviceId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามชื่อ, IP, สถานที่..."
        searchKeys={[
          "deviceName",
          "deviceIpAddress",
          "deviceMacAddress",
          "deviceLocation",
          "deviceManufacturer",
        ]}
        statusField="deviceStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบอุปกรณ์เครือข่าย"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มอุปกรณ์
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
            {editingDevice ? "แก้ไขอุปกรณ์" : "เพิ่มอุปกรณ์"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่ออุปกรณ์"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่ออุปกรณ์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deviceName}
                    onChange={(e) => updateField("deviceName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.deviceName}
                    errorMessage={validationErrors?.deviceName}
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
                    selectedKeys={formData.deviceType ? [formData.deviceType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("deviceType", val);
                    }}
                  >
                    <SelectItem key="router">เราเตอร์</SelectItem>
                    <SelectItem key="switch">สวิตช์</SelectItem>
                    <SelectItem key="ap">แอคเซสพอยต์</SelectItem>
                    <SelectItem key="firewall">ไฟร์วอลล์</SelectItem>
                    <SelectItem key="other">อื่นๆ</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ที่อยู่ IP"
                    labelPlacement="outside"
                    placeholder="e.g. 192.168.1.1"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deviceIpAddress}
                    onChange={(e) => updateField("deviceIpAddress", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ที่อยู่ MAC"
                    labelPlacement="outside"
                    placeholder="e.g. AA:BB:CC:DD:EE:FF"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deviceMacAddress}
                    onChange={(e) => updateField("deviceMacAddress", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="สถานที่"
                    labelPlacement="outside"
                    placeholder="ใส่สถานที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deviceLocation}
                    onChange={(e) => updateField("deviceLocation", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้ผลิต"
                    labelPlacement="outside"
                    placeholder="ใส่ผู้ผลิต"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deviceManufacturer}
                    onChange={(e) => updateField("deviceManufacturer", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="รุ่น"
                    labelPlacement="outside"
                    placeholder="ใส่รุ่น"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.deviceModel}
                    onChange={(e) => updateField("deviceModel", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.deviceStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "online";
                      updateField("deviceStatus", val);
                    }}
                  >
                    <SelectItem key="online">ออนไลน์</SelectItem>
                    <SelectItem key="offline">ออฟไลน์</SelectItem>
                    <SelectItem key="maintenance">ซ่อมบำรุง</SelectItem>
                  </Select>
                </div>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="หมายเหตุ"
                  labelPlacement="outside"
                  placeholder="ใส่หมายเหตุ"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.deviceNotes}
                  onChange={(e) => updateField("deviceNotes", e.target.value)}
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
              {editingDevice ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบอุปกรณ์</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingDevice?.deviceName}
              </span>
              ? การดำเนินการนี้ไม่สามารถย้อนกลับได้
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
