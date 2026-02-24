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
import { useItAssets } from "@/hooks/it/useItAssets";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อทรัพย์สิน", uid: "assetName", sortable: true },
  { name: "แท็กทรัพย์สิน", uid: "assetTag", sortable: true },
  { name: "หมวดหมู่", uid: "assetCategory", sortable: true },
  { name: "ยี่ห้อ", uid: "assetBrand" },
  { name: "รุ่น", uid: "assetModel" },
  { name: "ผู้รับผิดชอบ", uid: "assetAssignedTo" },
  { name: "สถานที่", uid: "assetLocation" },
  { name: "สถานะ", uid: "assetStatus", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "เปิดใช้งาน", uid: "active" },
  { name: "ซ่อมบำรุง", uid: "maintenance" },
  { name: "ปลดระวาง", uid: "retired" },
  { name: "จำหน่ายแล้ว", uid: "disposed" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "assetName",
  "assetTag",
  "assetCategory",
  "assetBrand",
  "assetAssignedTo",
  "assetStatus",
  "actions",
];

export default function AssetsPage() {
  const {
    assets,
    loading,
    saving,
    editingAsset,
    formData,
    validationErrors,
    deletingAsset,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useItAssets();

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "assetName":
          return <span className="font-medium">{item.assetName}</span>;
        case "assetTag":
          return <span className="text-default-500">{item.assetTag || "-"}</span>;
        case "assetCategory":
          return item.assetCategory || "-";
        case "assetBrand":
          return item.assetBrand || "-";
        case "assetModel":
          return item.assetModel || "-";
        case "assetAssignedTo":
          return item.assetAssignedTo || "-";
        case "assetLocation":
          return item.assetLocation || "-";
        case "assetStatus": {
          const colorMap = {
            active: "success",
            maintenance: "warning",
            retired: "default",
            disposed: "danger",
          };
          return (
            <Chip
              variant="bordered"
              size="md"
              radius="md"
              color={colorMap[item.assetStatus] || "default"}
            >
              {item.assetStatus}
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
        data={assets}
        renderCell={renderCell}
        enableCardView
        rowKey="assetId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามชื่อ, แท็ก, ยี่ห้อ, สถานที่..."
        searchKeys={[
          "assetName",
          "assetTag",
          "assetBrand",
          "assetModel",
          "assetAssignedTo",
          "assetLocation",
        ]}
        statusField="assetStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบทรัพย์สิน"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มทรัพย์สิน
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
            {editingAsset ? "แก้ไขทรัพย์สิน" : "เพิ่มทรัพย์สิน"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อทรัพย์สิน"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อทรัพย์สิน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetName}
                    onChange={(e) => updateField("assetName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.assetName}
                    errorMessage={validationErrors?.assetName}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="แท็กทรัพย์สิน"
                    labelPlacement="outside"
                    placeholder="ใส่แท็กทรัพย์สิน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetTag}
                    onChange={(e) => updateField("assetTag", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="หมวดหมู่"
                    labelPlacement="outside"
                    placeholder="เลือกหมวดหมู่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={formData.assetCategory ? [formData.assetCategory] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("assetCategory", val);
                    }}
                  >
                    <SelectItem key="computer">คอมพิวเตอร์</SelectItem>
                    <SelectItem key="server">เซิร์ฟเวอร์</SelectItem>
                    <SelectItem key="printer">เครื่องพิมพ์</SelectItem>
                    <SelectItem key="network">เครือข่าย</SelectItem>
                    <SelectItem key="other">อื่นๆ</SelectItem>
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ยี่ห้อ"
                    labelPlacement="outside"
                    placeholder="ใส่ยี่ห้อ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetBrand}
                    onChange={(e) => updateField("assetBrand", e.target.value)}
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
                    value={formData.assetModel}
                    onChange={(e) => updateField("assetModel", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="เลขซีเรียล"
                    labelPlacement="outside"
                    placeholder="ใส่เลขซีเรียล"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetSerialNumber}
                    onChange={(e) => updateField("assetSerialNumber", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ผู้รับผิดชอบ"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อพนักงาน"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetAssignedTo}
                    onChange={(e) => updateField("assetAssignedTo", e.target.value)}
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
                    value={formData.assetLocation}
                    onChange={(e) => updateField("assetLocation", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันที่ซื้อ"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetPurchaseDate}
                    onChange={(e) => updateField("assetPurchaseDate", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="date"
                    label="วันหมดประกัน"
                    labelPlacement="outside"
                    placeholder="เลือกวันที่"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.assetWarrantyExpiry}
                    onChange={(e) => updateField("assetWarrantyExpiry", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.assetStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "active";
                      updateField("assetStatus", val);
                    }}
                  >
                    <SelectItem key="active">เปิดใช้งาน</SelectItem>
                    <SelectItem key="maintenance">ซ่อมบำรุง</SelectItem>
                    <SelectItem key="retired">ปลดระวาง</SelectItem>
                    <SelectItem key="disposed">จำหน่ายแล้ว</SelectItem>
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
                  value={formData.assetNotes}
                  onChange={(e) => updateField("assetNotes", e.target.value)}
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
              {editingAsset ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบทรัพย์สิน</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingAsset?.assetName}
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
