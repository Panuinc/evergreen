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
  { name: "ชื่อ", uid: "name", sortable: true },
  { name: "อีเมล", uid: "hrEmployeeEmail", sortable: true },
  { name: "โทรศัพท์", uid: "hrEmployeePhone" },
  { name: "ฝ่าย", uid: "hrEmployeeDivision", sortable: true },
  { name: "แผนก", uid: "hrEmployeeDepartment", sortable: true },
  { name: "ตำแหน่ง", uid: "hrEmployeePosition", sortable: true },
  { name: "สถานะ", uid: "isActive", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const statusOptions = [
  { name: "เปิดใช้งาน", uid: "true" },
  { name: "ปิดใช้งาน", uid: "false" },
];

const BASE_VISIBLE_COLUMNS = [
  "name",
  "hrEmployeeEmail",
  "hrEmployeeDivision",
  "hrEmployeeDepartment",
  "hrEmployeePosition",
  "isActive",
  "actions",
];

export default function EmployeesView({
  employees,
  divisions,
  departments,
  positions,
  loading,
  saving,
  editingEmployee,
  formData,
  onUpdateField,
  deletingEmployee,
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

  const initialVisibleColumns = BASE_VISIBLE_COLUMNS;
  const columns = baseColumns;

  const renderCell = useCallback(
    (emp, columnKey) => {
      switch (columnKey) {
        case "name":
          return (
            <span className="font-light">
              {emp.hrEmployeeFirstName} {emp.hrEmployeeLastName}
            </span>
          );
        case "hrEmployeeEmail":
          return (
            <span className="text-muted-foreground">{emp.hrEmployeeEmail || "-"}</span>
          );
        case "hrEmployeePhone":
          return (
            <span className="text-muted-foreground">{emp.hrEmployeePhone || "-"}</span>
          );
        case "hrEmployeeDivision":
          return emp.hrEmployeeDivision || "-";
        case "hrEmployeeDepartment":
          return emp.hrEmployeeDepartment || "-";
        case "hrEmployeePosition":
          return emp.hrEmployeePosition || "-";
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={emp.isActive ? "success" : "default"}
            >
              {emp.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
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
                onPress={() => onOpen(emp)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={emp.isActive}
                  onValueChange={() => toggleActive(emp)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => onConfirmDelete(emp)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return emp[columnKey] || "-";
      }
    },
    [onOpen, onConfirmDelete, isSuperAdmin, toggleActive],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={employees}
        renderCell={renderCell}
        enableCardView
        rowKey="hrEmployeeId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อ, อีเมล, แผนก, ตำแหน่ง..."
        searchKeys={[
          "hrEmployeeFirstName",
          "hrEmployeeLastName",
          "hrEmployeeEmail",
          "hrEmployeePhone",
          "hrEmployeeDivision",
          "hrEmployeeDepartment",
          "hrEmployeePosition",
        ]}
        statusField="isActive"
        statusOptions={statusOptions}
        emptyContent="ไม่พบพนักงาน"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => onOpen()}
          >
            เพิ่มพนักงาน
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
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>
            {editingEmployee ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="ชื่อ"
                    labelPlacement="outside"
                    placeholder="ใส่ชื่อ"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.hrEmployeeFirstName}
                    onChange={(e) =>
                      onUpdateField("hrEmployeeFirstName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="นามสกุล"
                    labelPlacement="outside"
                    placeholder="ใส่นามสกุล"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.hrEmployeeLastName}
                    onChange={(e) =>
                      onUpdateField("hrEmployeeLastName", e.target.value)
                    }
                    isRequired
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    type="email"
                    label="อีเมล"
                    labelPlacement="outside"
                    placeholder="ใส่อีเมล"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.hrEmployeeEmail}
                    onChange={(e) =>
                      onUpdateField("hrEmployeeEmail", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Input
                    label="โทรศัพท์"
                    labelPlacement="outside"
                    placeholder="ใส่เบอร์โทรศัพท์"
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={formData.hrEmployeePhone}
                    onChange={(e) =>
                      onUpdateField("hrEmployeePhone", e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ฝ่าย"
                    labelPlacement="outside"
                    placeholder="เลือกฝ่าย"
                    variant="bordered"
                    size="md"
                    radius="md"
                    selectedKeys={
                      formData.hrEmployeeDivision
                        ? [formData.hrEmployeeDivision]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      onUpdateField("hrEmployeeDivision", val);
                      onUpdateField("hrEmployeeDepartment", "");
                      onUpdateField("hrEmployeePosition", "");
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
                  <Select
                    label="แผนก"
                    labelPlacement="outside"
                    placeholder={formData.hrEmployeeDivision ? "เลือกแผนก" : "เลือกฝ่ายก่อน"}
                    variant="bordered"
                    size="md"
                    radius="md"
                    isDisabled={!formData.hrEmployeeDivision}
                    selectedKeys={
                      formData.hrEmployeeDepartment
                        ? [formData.hrEmployeeDepartment]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      onUpdateField("hrEmployeeDepartment", val);
                      onUpdateField("hrEmployeePosition", "");
                    }}
                  >
                    {departments
                      .filter((dept) => dept.hrDepartmentDivision === formData.hrEmployeeDivision)
                      .map((dept) => (
                        <SelectItem key={dept.hrDepartmentName}>
                          {dept.hrDepartmentName}
                        </SelectItem>
                      ))}
                  </Select>
                </div>
                <div className="flex items-center w-full h-fit p-2 gap-2">
                  <Select
                    label="ตำแหน่ง"
                    labelPlacement="outside"
                    placeholder={formData.hrEmployeeDepartment ? "เลือกตำแหน่ง" : "เลือกแผนกก่อน"}
                    variant="bordered"
                    size="md"
                    radius="md"
                    isDisabled={!formData.hrEmployeeDepartment}
                    selectedKeys={
                      formData.hrEmployeePosition
                        ? [formData.hrEmployeePosition]
                        : []
                    }
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0] || "";
                      onUpdateField("hrEmployeePosition", val);
                    }}
                  >
                    {positions
                      .filter((pos) => pos.hrPositionDepartment === formData.hrEmployeeDepartment)
                      .map((pos) => (
                        <SelectItem key={pos.hrPositionTitle}>
                          {pos.hrPositionTitle}
                        </SelectItem>
                      ))}
                  </Select>
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
              onPress={onSave}
              isLoading={saving}
            >
              {editingEmployee ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบพนักงาน</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-light">
                {deletingEmployee?.hrEmployeeFirstName}{" "}
                {deletingEmployee?.hrEmployeeLastName}
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
