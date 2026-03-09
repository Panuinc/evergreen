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
  Textarea,
  Chip,
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "ชื่อตำแหน่ง", uid: "hrPositionTitle", sortable: true },
  { name: "แผนก", uid: "hrPositionDepartment", sortable: true },
  { name: "รายละเอียด", uid: "hrPositionDescription" },
  { name: "วันที่สร้าง", uid: "hrPositionCreatedAt", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const BASE_VISIBLE_COLUMNS = [
  "hrPositionTitle",
  "hrPositionDepartment",
  "hrPositionDescription",
  "actions",
];

export default function PositionsView({
  positions,
  departments,
  loading,
  saving,
  editingPos,
  formData,
  onFormDataChange,
  deletingPos,
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

  const deptOptions = departments.map((d) => ({
    name: d.hrDepartmentName,
    uid: d.hrDepartmentName,
  }));

  const renderCell = useCallback(
    (pos, columnKey) => {
      switch (columnKey) {
        case "hrPositionTitle":
          return <span className="font-light">{pos.hrPositionTitle}</span>;
        case "hrPositionDepartment":
          return pos.hrPositionDepartment || "-";
        case "hrPositionDescription":
          return (
            <span className="text-muted-foreground">
              {pos.hrPositionDescription || "-"}
            </span>
          );
        case "hrPositionCreatedAt":
          return (
            <span className="text-muted-foreground">
              {new Date(pos.hrPositionCreatedAt).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}
            </span>
          );
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={pos.isActive ? "success" : "danger"}
            >
              {pos.isActive ? "Active" : "Inactive"}
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
                onPress={() => onOpen(pos)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={pos.isActive}
                  onValueChange={() => toggleActive(pos)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => onConfirmDelete(pos)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return pos[columnKey] || "-";
      }
    },
    [onOpen, onConfirmDelete, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={positions}
        renderCell={renderCell}
        enableCardView
        rowKey="hrPositionId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อตำแหน่ง, แผนก, รายละเอียด..."
        searchKeys={[
          "hrPositionTitle",
          "hrPositionDepartment",
          "hrPositionDescription",
        ]}
        statusField="hrPositionDepartment"
        statusOptions={deptOptions}
        filterLabel="แผนก"
        emptyContent="ไม่พบตำแหน่ง"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => onOpen()}
          >
            เพิ่มตำแหน่ง
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
            {editingPos ? "แก้ไขตำแหน่ง" : "เพิ่มตำแหน่ง"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Select
                  label="แผนก"
                  labelPlacement="outside"
                  placeholder="เลือกแผนก"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={
                    formData.hrPositionDepartment
                      ? [formData.hrPositionDepartment]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] || "";
                    onFormDataChange({ ...formData, hrPositionDepartment: val });
                  }}
                  isRequired
                >
                  {departments.map((dept) => (
                    <SelectItem key={dept.hrDepartmentName}>
                      {dept.hrDepartmentName}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="ชื่อตำแหน่ง"
                  labelPlacement="outside"
                  placeholder="เช่น วิศวกรซอฟต์แวร์, ผู้จัดการฝ่ายบุคคล"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrPositionTitle}
                  onChange={(e) =>
                    onFormDataChange({ ...formData, hrPositionTitle: e.target.value })
                  }
                  isRequired
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายเกี่ยวกับตำแหน่งนี้..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.hrPositionDescription}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      hrPositionDescription: e.target.value,
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
              {editingPos ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบตำแหน่ง</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingPos?.hrPositionTitle}
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
