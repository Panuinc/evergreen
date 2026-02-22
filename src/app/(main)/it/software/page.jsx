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
import { useItSoftware } from "@/hooks/useItSoftware";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อซอฟต์แวร์", uid: "softwareName", sortable: true },
  { name: "ผู้จำหน่าย", uid: "softwareVendor", sortable: true },
  { name: "เวอร์ชัน", uid: "softwareVersion" },
  { name: "ประเภทไลเซนส์", uid: "softwareLicenseType" },
  { name: "ไลเซนส์", uid: "licenseUsage" },
  { name: "วันหมดอายุ", uid: "softwareExpiryDate", sortable: true },
  { name: "สถานะ", uid: "softwareStatus", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "เปิดใช้งาน", uid: "active" },
  { name: "หมดอายุ", uid: "expired" },
  { name: "ยกเลิก", uid: "cancelled" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "softwareName",
  "softwareVendor",
  "softwareLicenseType",
  "licenseUsage",
  "softwareExpiryDate",
  "softwareStatus",
  "actions",
];

export default function SoftwarePage() {
  const {
    software,
    loading,
    saving,
    editingSoftware,
    formData,
    validationErrors,
    deletingSoftware,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItSoftware();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "softwareName":
          return <span className="font-medium">{item.softwareName}</span>;
        case "softwareVendor":
          return item.softwareVendor || "-";
        case "softwareVersion":
          return item.softwareVersion || "-";
        case "softwareLicenseType":
          return item.softwareLicenseType || "-";
        case "licenseUsage":
          return `${item.softwareUsedCount || 0} / ${item.softwareLicenseCount || 0}`;
        case "softwareExpiryDate":
          return item.softwareExpiryDate || "-";
        case "softwareStatus": {
          const colorMap = {
            active: "success",
            expired: "danger",
            cancelled: "default",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.softwareStatus] || "default"}
            >
              {item.softwareStatus}
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
        data={software}
        renderCell={renderCell}
        enableCardView
        rowKey="softwareId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามชื่อ, ผู้จำหน่าย, รหัสไลเซนส์..."
        searchKeys={[
          "softwareName",
          "softwareVendor",
          "softwareLicenseKey",
          "softwareVersion",
        ]}
        statusField="softwareStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบซอฟต์แวร์"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มซอฟต์แวร์
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
            {editingSoftware ? "แก้ไขซอฟต์แวร์" : "เพิ่มซอฟต์แวร์"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อซอฟต์แวร์"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อซอฟต์แวร์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareName}
                    onChange={(e) => updateField("softwareName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.softwareName}
                    errorMessage={validationErrors?.softwareName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้จำหน่าย"
                    labelPlacement="outside"
                    placeholder="ใส่ผู้จำหน่าย"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareVendor}
                    onChange={(e) => updateField("softwareVendor", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="เวอร์ชัน"
                    labelPlacement="outside"
                    placeholder="ใส่เวอร์ชัน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareVersion}
                    onChange={(e) => updateField("softwareVersion", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="รหัสไลเซนส์"
                    labelPlacement="outside"
                    placeholder="ใส่รหัสไลเซนส์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareLicenseKey}
                    onChange={(e) => updateField("softwareLicenseKey", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ประเภทไลเซนส์"
                    labelPlacement="outside"
                    placeholder="เลือกประเภท"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.softwareLicenseType ? [formData.softwareLicenseType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("softwareLicenseType", val);
                    }}
                  >
                    <SelectItem key="perpetual">ถาวร</SelectItem>
                    <SelectItem key="subscription">สมัครสมาชิก</SelectItem>
                    <SelectItem key="open_source">โอเพนซอร์ส</SelectItem>
                    <SelectItem key="trial">ทดลองใช้</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="ไลเซนส์ทั้งหมด"
                    labelPlacement="outside"
                    placeholder="ใส่จำนวนทั้งหมด"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareLicenseCount}
                    onChange={(e) => updateField("softwareLicenseCount", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="number"
                    label="ไลเซนส์ที่ใช้แล้ว"
                    labelPlacement="outside"
                    placeholder="ใส่จำนวนที่ใช้แล้ว"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareUsedCount}
                    onChange={(e) => updateField("softwareUsedCount", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันหมดอายุ"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.softwareExpiryDate}
                    onChange={(e) => updateField("softwareExpiryDate", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.softwareStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "active";
                      updateField("softwareStatus", val);
                    }}
                  >
                    <SelectItem key="active">เปิดใช้งาน</SelectItem>
                    <SelectItem key="expired">หมดอายุ</SelectItem>
                    <SelectItem key="cancelled">ยกเลิก</SelectItem>
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
                  value={formData.softwareNotes}
                  onChange={(e) => updateField("softwareNotes", e.target.value)}
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
              {editingSoftware ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบซอฟต์แวร์</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingSoftware?.softwareName}
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
