import { useCallback, useMemo } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Chip,
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "ชื่อ", uid: "hrDivisionName", sortable: true },
  { name: "รายละเอียด", uid: "hrDivisionDescription" },
  { name: "วันที่สร้าง", uid: "hrDivisionCreatedAt", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const BASE_VISIBLE_COLUMNS = [
  "hrDivisionName",
  "hrDivisionDescription",
  "hrDivisionCreatedAt",
  "actions",
];

export default function DivisionsView({
  divisions,
  loading,
  saving,
  editingDiv,
  formData,
  onFormDataChange,
  deletingDiv,
  isOpen,
  onClose,
  deleteModal,
  onOpen,
  onSave,
  onConfirmDelete,
  onDelete,
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
    (div, columnKey) => {
      switch (columnKey) {
        case "hrDivisionName":
          return <span className="font-light">{div.hrDivisionName}</span>;
        case "hrDivisionDescription":
          return (
            <span className="text-muted-foreground">
              {div.hrDivisionDescription || "-"}
            </span>
          );
        case "hrDivisionCreatedAt":
          return (
            <span className="text-muted-foreground">
              {new Date(div.hrDivisionCreatedAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
            </span>
          );
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={div.isActive ? "success" : "danger"}
            >
              {div.isActive ? "Active" : "Inactive"}
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
                onPress={() => onOpen(div)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={div.isActive}
                  onValueChange={() => toggleActive(div)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => onConfirmDelete(div)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return div[columnKey] || "-";
      }
    },
    [onOpen, onConfirmDelete, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={divisions}
        renderCell={renderCell}
        enableCardView
        rowKey="hrDivisionId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อ, รายละเอียด..."
        searchKeys={["hrDivisionName", "hrDivisionDescription"]}
        emptyContent="ไม่พบฝ่าย"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => onOpen()}
          >
            เพิ่มฝ่าย
          </Button>
        }
        actionMenuItems={(item) => [
          { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => onOpen(item) },
          isSuperAdmin
            ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power />, onPress: () => toggleActive(item) }
            : { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => onConfirmDelete(item) },
        ].filter(Boolean)}
      />

      {}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingDiv ? "แก้ไขฝ่าย" : "เพิ่มฝ่าย"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="ชื่อ"
                  labelPlacement="outside"
                  placeholder="เช่น ฝ่ายปฏิบัติการ, ฝ่ายบริหาร, ฝ่ายสนับสนุน"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrDivisionName}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, hrDivisionName: e.target.value })
                  }
                  isRequired
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายเกี่ยวกับฝ่ายนี้..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrDivisionDescription}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      hrDivisionDescription: e.target.value,
                    })
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
              onPress={onSave}
              isLoading={saving}
            >
              {editingDiv ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบฝ่าย</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingDiv?.hrDivisionName}
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
              onPress={onDelete}
            >
              ลบ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
