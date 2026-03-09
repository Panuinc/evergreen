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
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่ออุปกรณ์", uid: "itNetworkDeviceName", sortable: true },
  { name: "ประเภท", uid: "itNetworkDeviceType", sortable: true },
  { name: "ที่อยู่ IP", uid: "itNetworkDeviceIpAddress" },
  { name: "ที่อยู่ MAC", uid: "itNetworkDeviceMacAddress" },
  { name: "สถานที่", uid: "itNetworkDeviceLocation" },
  { name: "ผู้ผลิต", uid: "itNetworkDeviceManufacturer" },
  { name: "สถานะ", uid: "itNetworkDeviceStatus", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "ออนไลน์", uid: "online" },
  { name: "ออฟไลน์", uid: "offline" },
  { name: "ซ่อมบำรุง", uid: "maintenance" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "itNetworkDeviceName",
  "itNetworkDeviceType",
  "itNetworkDeviceIpAddress",
  "itNetworkDeviceLocation",
  "itNetworkDeviceStatus",
  "actions",
];

export default function NetworkView({
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
}) {
  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "itNetworkDeviceName":
          return <span className="font-light">{item.itNetworkDeviceName}</span>;
        case "itNetworkDeviceType":
          return item.itNetworkDeviceType || "-";
        case "itNetworkDeviceIpAddress":
          return <span className="text-muted-foreground">{item.itNetworkDeviceIpAddress || "-"}</span>;
        case "itNetworkDeviceMacAddress":
          return <span className="text-muted-foreground">{item.itNetworkDeviceMacAddress || "-"}</span>;
        case "itNetworkDeviceLocation":
          return item.itNetworkDeviceLocation || "-";
        case "itNetworkDeviceManufacturer":
          return item.itNetworkDeviceManufacturer || "-";
        case "itNetworkDeviceStatus": {
          const colorMap = {
            online: "success",
            offline: "danger",
            maintenance: "warning",
          };
          return (
            <Chip
              variant="shadow"
              size="md"
              radius="md"
              color={colorMap[item.itNetworkDeviceStatus] || "default"}
            >
              {item.itNetworkDeviceStatus}
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
        rowKey="itNetworkDeviceId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามชื่อ, IP, สถานที่..."
        searchKeys={[
          "itNetworkDeviceName",
          "itNetworkDeviceIpAddress",
          "itNetworkDeviceMacAddress",
          "itNetworkDeviceLocation",
          "itNetworkDeviceManufacturer",
        ]}
        statusField="itNetworkDeviceStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบอุปกรณ์เครือข่าย"
        actionMenuItems={(item) => [
          { key: "edit", label: "แก้ไข", icon: <Edit size={16} />, onPress: () => handleOpen(item) },
          { key: "delete", label: "ลบ", icon: <Trash2 size={16} />, color: "danger", onPress: () => confirmDelete(item) },
        ]}
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
                    value={formData.itNetworkDeviceName}
                    onChange={(e) => updateField("itNetworkDeviceName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.itNetworkDeviceName}
                    errorMessage={validationErrors?.itNetworkDeviceName}
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
                    selectedKeys={formData.itNetworkDeviceType ? [formData.itNetworkDeviceType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("itNetworkDeviceType", val);
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
                    value={formData.itNetworkDeviceIpAddress}
                    onChange={(e) => updateField("itNetworkDeviceIpAddress", e.target.value)}
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
                    value={formData.itNetworkDeviceMacAddress}
                    onChange={(e) => updateField("itNetworkDeviceMacAddress", e.target.value)}
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
                    value={formData.itNetworkDeviceLocation}
                    onChange={(e) => updateField("itNetworkDeviceLocation", e.target.value)}
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
                    value={formData.itNetworkDeviceManufacturer}
                    onChange={(e) => updateField("itNetworkDeviceManufacturer", e.target.value)}
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
                    value={formData.itNetworkDeviceModel}
                    onChange={(e) => updateField("itNetworkDeviceModel", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.itNetworkDeviceStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "online";
                      updateField("itNetworkDeviceStatus", val);
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
                  value={formData.itNetworkDeviceNotes}
                  onChange={(e) => updateField("itNetworkDeviceNotes", e.target.value)}
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
              <span className="font-light">
                {deletingDevice?.itNetworkDeviceName}
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
