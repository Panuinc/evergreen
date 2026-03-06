"use client";

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
import { Plus, Edit, Trash2, Power } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "ชื่อซอฟต์แวร์", uid: "itSoftwareName", sortable: true },
  { name: "ผู้จำหน่าย", uid: "itSoftwareVendor", sortable: true },
  { name: "เวอร์ชัน", uid: "itSoftwareVersion" },
  { name: "ประเภทไลเซนส์", uid: "itSoftwareLicenseType" },
  { name: "ไลเซนส์", uid: "itSoftwareLicenseUsage" },
  { name: "วันหมดอายุ", uid: "itSoftwareExpiryDate", sortable: true },
  { name: "สถานะ", uid: "itSoftwareStatus", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "เปิดใช้งาน", uid: "active" },
  { name: "หมดอายุ", uid: "expired" },
  { name: "ยกเลิก", uid: "cancelled" },
];

const BASE_VISIBLE_COLUMNS = [
  "itSoftwareName",
  "itSoftwareVendor",
  "itSoftwareLicenseType",
  "itSoftwareLicenseUsage",
  "itSoftwareExpiryDate",
  "itSoftwareStatus",
  "actions",
];

export default function SoftwareView({
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
        case "itSoftwareName":
          return <span className="font-medium">{item.itSoftwareName}</span>;
        case "itSoftwareVendor":
          return item.itSoftwareVendor || "-";
        case "itSoftwareVersion":
          return item.itSoftwareVersion || "-";
        case "itSoftwareLicenseType":
          return item.itSoftwareLicenseType || "-";
        case "itSoftwareLicenseUsage":
          return `${item.itSoftwareUsedCount || 0} / ${item.itSoftwareLicenseCount || 0}`;
        case "itSoftwareExpiryDate":
          return item.itSoftwareExpiryDate || "-";
        case "itSoftwareStatus": {
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
              color={colorMap[item.itSoftwareStatus] || "default"}
            >
              {item.itSoftwareStatus}
            </Chip>
          );
        }
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
    [handleOpen, confirmDelete, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={software}
        renderCell={renderCell}
        enableCardView
        rowKey="itSoftwareId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อ, ผู้จำหน่าย, รหัสไลเซนส์..."
        searchKeys={[
          "itSoftwareName",
          "itSoftwareVendor",
          "itSoftwareLicenseKey",
          "itSoftwareVersion",
        ]}
        statusField="itSoftwareStatus"
        statusOptions={statusOptions}
        emptyContent="ไม่พบซอฟต์แวร์"
        actionMenuItems={(item) => [
          { key: "edit", label: "แก้ไข", icon: <Edit size={16} />, onPress: () => handleOpen(item) },
          isSuperAdmin
            ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power size={16} />, onPress: () => toggleActive(item) }
            : { key: "delete", label: "ลบ", icon: <Trash2 size={16} />, color: "danger", onPress: () => confirmDelete(item) },
        ].filter(Boolean)}
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
                    value={formData.itSoftwareName}
                    onChange={(e) => updateField("itSoftwareName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.itSoftwareName}
                    errorMessage={validationErrors?.itSoftwareName}
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
                    value={formData.itSoftwareVendor}
                    onChange={(e) => updateField("itSoftwareVendor", e.target.value)}
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
                    value={formData.itSoftwareVersion}
                    onChange={(e) => updateField("itSoftwareVersion", e.target.value)}
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
                    value={formData.itSoftwareLicenseKey}
                    onChange={(e) => updateField("itSoftwareLicenseKey", e.target.value)}
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
                    selectedKeys={formData.itSoftwareLicenseType ? [formData.itSoftwareLicenseType] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("itSoftwareLicenseType", val);
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
                    value={formData.itSoftwareLicenseCount}
                    onChange={(e) => updateField("itSoftwareLicenseCount", e.target.value)}
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
                    value={formData.itSoftwareUsedCount}
                    onChange={(e) => updateField("itSoftwareUsedCount", e.target.value)}
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
                    value={formData.itSoftwareExpiryDate}
                    onChange={(e) => updateField("itSoftwareExpiryDate", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.itSoftwareStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "active";
                      updateField("itSoftwareStatus", val);
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
                  value={formData.itSoftwareNotes}
                  onChange={(e) => updateField("itSoftwareNotes", e.target.value)}
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
                {deletingSoftware?.itSoftwareName}
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
