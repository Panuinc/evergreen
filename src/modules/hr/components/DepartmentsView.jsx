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
  Select,
  SelectItem,
  Chip,
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "ชื่อ", uid: "hrDepartmentName", sortable: true },
  { name: "ฝ่าย", uid: "hrDepartmentDivision", sortable: true },
  { name: "รายละเอียด", uid: "hrDepartmentDescription" },
  { name: "วันที่สร้าง", uid: "hrDepartmentCreatedAt", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const BASE_VISIBLE_COLUMNS = [
  "hrDepartmentName",
  "hrDepartmentDivision",
  "hrDepartmentDescription",
  "hrDepartmentCreatedAt",
  "actions",
];

export default function DepartmentsView({
  departments,
  divisions,
  loading,
  saving,
  editingDept,
  formData,
  onFormDataChange,
  deletingDept,
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
    (dept, columnKey) => {
      switch (columnKey) {
        case "hrDepartmentName":
          return <span className="font-light">{dept.hrDepartmentName}</span>;
        case "hrDepartmentDivision":
          return dept.hrDepartmentDivision || "-";
        case "hrDepartmentDescription":
          return (
            <span className="text-muted-foreground">
              {dept.hrDepartmentDescription || "-"}
            </span>
          );
        case "hrDepartmentCreatedAt":
          return (
            <span className="text-muted-foreground">
              {new Date(dept.hrDepartmentCreatedAt).toLocaleDateString("th-TH")}
            </span>
          );
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={dept.isActive ? "success" : "danger"}
            >
              {dept.isActive ? "Active" : "Inactive"}
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
                onPress={() => onOpen(dept)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={dept.isActive}
                  onValueChange={() => toggleActive(dept)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => onConfirmDelete(dept)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return dept[columnKey] || "-";
      }
    },
    [onOpen, onConfirmDelete, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={departments}
        renderCell={renderCell}
        enableCardView
        rowKey="hrDepartmentId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อ, ฝ่าย, รายละเอียด..."
        searchKeys={["hrDepartmentName", "hrDepartmentDivision", "hrDepartmentDescription"]}
        emptyContent="ไม่พบแผนก"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => onOpen()}
          >
            เพิ่มแผนก
          </Button>
        }
        actionMenuItems={(item) => [
          { key: "edit", label: "แก้ไข", icon: <Edit />, onPress: () => onOpen(item) },
          isSuperAdmin
            ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power />, onPress: () => toggleActive(item) }
            : { key: "delete", label: "ลบ", icon: <Trash2 />, color: "danger", onPress: () => onConfirmDelete(item) },
        ].filter(Boolean)}
      />

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingDept ? "แก้ไขแผนก" : "เพิ่มแผนก"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Select
                  label="ฝ่าย"
                  labelPlacement="outside"
                  placeholder="เลือกฝ่าย"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={
                    formData.hrDepartmentDivision
                      ? [formData.hrDepartmentDivision]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] || "";
                    onFormDataChange({ ...formData, hrDepartmentDivision: val });
                  }}
                >
                  {divisions.map((div) => (
                    <SelectItem key={div.hrDivisionName}>
                      {div.hrDivisionName}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="ชื่อ"
                  labelPlacement="outside"
                  placeholder="เช่น IT, HR, การเงิน"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrDepartmentName}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, hrDepartmentName: e.target.value })
                  }
                  isRequired
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายเกี่ยวกับแผนกนี้..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrDepartmentDescription}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      hrDepartmentDescription: e.target.value,
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
              {editingDept ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบแผนก</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingDept?.hrDepartmentName}
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
