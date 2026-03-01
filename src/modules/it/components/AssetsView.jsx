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
import { Plus, Edit, Trash2 } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "ชื่อทรัพย์สิน", uid: "itAssetName", sortable: true },
  { name: "แท็กทรัพย์สิน", uid: "itAssetTag", sortable: true },
  { name: "หมวดหมู่", uid: "itAssetCategory", sortable: true },
  { name: "ยี่ห้อ", uid: "itAssetBrand" },
  { name: "รุ่น", uid: "itAssetModel" },
  { name: "ผู้รับผิดชอบ", uid: "itAssetAssignedTo" },
  { name: "สถานที่", uid: "itAssetLocation" },
  { name: "สถานะ", uid: "itAssetStatus", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "เปิดใช้งาน", uid: "active" },
  { name: "ซ่อมบำรุง", uid: "maintenance" },
  { name: "ปลดระวาง", uid: "retired" },
  { name: "จำหน่ายแล้ว", uid: "disposed" },
];

const BASE_VISIBLE_COLUMNS = [
  "itAssetName",
  "itAssetTag",
  "itAssetCategory",
  "itAssetBrand",
  "itAssetAssignedTo",
  "itAssetStatus",
  "actions",
];

export default function AssetsView({
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
        case "itAssetName":
          return <span className="font-medium">{item.itAssetName}</span>;
        case "itAssetTag":
          return <span className="text-default-500">{item.itAssetTag || "-"}</span>;
        case "itAssetCategory":
          return item.itAssetCategory || "-";
        case "itAssetBrand":
          return item.itAssetBrand || "-";
        case "itAssetModel":
          return item.itAssetModel || "-";
        case "itAssetAssignedTo":
          return item.itAssetAssignedTo || "-";
        case "itAssetLocation":
          return item.itAssetLocation || "-";
        case "itAssetStatus": {
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
              color={colorMap[item.itAssetStatus] || "default"}
            >
              {item.itAssetStatus}
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
        data={assets}
        renderCell={renderCell}
        enableCardView
        rowKey="itAssetId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อ, แท็ก, ยี่ห้อ, สถานที่..."
        searchKeys={[
          "itAssetName",
          "itAssetTag",
          "itAssetBrand",
          "itAssetModel",
          "itAssetAssignedTo",
          "itAssetLocation",
        ]}
        statusField="itAssetStatus"
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
                    value={formData.itAssetName}
                    onChange={(e) => updateField("itAssetName", e.target.value)}
                    isRequired
                    isInvalid={!!validationErrors?.itAssetName}
                    errorMessage={validationErrors?.itAssetName}
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
                    value={formData.itAssetTag}
                    onChange={(e) => updateField("itAssetTag", e.target.value)}
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
                    selectedKeys={formData.itAssetCategory ? [formData.itAssetCategory] : []}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      updateField("itAssetCategory", val);
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
                    value={formData.itAssetBrand}
                    onChange={(e) => updateField("itAssetBrand", e.target.value)}
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
                    value={formData.itAssetModel}
                    onChange={(e) => updateField("itAssetModel", e.target.value)}
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
                    value={formData.itAssetSerialNumber}
                    onChange={(e) => updateField("itAssetSerialNumber", e.target.value)}
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
                    value={formData.itAssetAssignedTo}
                    onChange={(e) => updateField("itAssetAssignedTo", e.target.value)}
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
                    value={formData.itAssetLocation}
                    onChange={(e) => updateField("itAssetLocation", e.target.value)}
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
                    value={formData.itAssetPurchaseDate}
                    onChange={(e) => updateField("itAssetPurchaseDate", e.target.value)}
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
                    value={formData.itAssetWarrantyExpiry}
                    onChange={(e) => updateField("itAssetWarrantyExpiry", e.target.value)}
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="สถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={[formData.itAssetStatus]}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "active";
                      updateField("itAssetStatus", val);
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
                  value={formData.itAssetNotes}
                  onChange={(e) => updateField("itAssetNotes", e.target.value)}
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
                {deletingAsset?.itAssetName}
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
