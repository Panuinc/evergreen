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
  Textarea,
  Select,
  SelectItem,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useDepartments } from "@/hooks/hr/useDepartments";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อ", uid: "departmentName", sortable: true },
  { name: "ฝ่าย", uid: "departmentDivision", sortable: true },
  { name: "รายละเอียด", uid: "departmentDescription" },
  { name: "วันที่สร้าง", uid: "departmentCreatedAt", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "departmentName",
  "departmentDivision",
  "departmentDescription",
  "departmentCreatedAt",
  "actions",
];

export default function DepartmentsPage() {
  const {
    departments,
    divisions,
    loading,
    saving,
    editingDept,
    formData,
    setFormData,
    deletingDept,
    isOpen,
    onClose,
    deleteModal,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useDepartments();

  const renderCell = useCallback(
    (dept, columnKey) => {
      switch (columnKey) {
        case "departmentName":
          return <span className="font-medium">{dept.departmentName}</span>;
        case "departmentDivision":
          return dept.departmentDivision || "-";
        case "departmentDescription":
          return (
            <span className="text-default-500">
              {dept.departmentDescription || "-"}
            </span>
          );
        case "departmentCreatedAt":
          return (
            <span className="text-default-500">
              {new Date(dept.departmentCreatedAt).toLocaleDateString("th-TH")}
            </span>
          );
        case "actions":
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleOpen(dept)}
              >
                <Edit />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(dept)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return dept[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={departments}
        renderCell={renderCell}
        enableCardView
        rowKey="departmentId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามชื่อ, ฝ่าย, รายละเอียด..."
        searchKeys={["departmentName", "departmentDivision", "departmentDescription"]}
        emptyContent="ไม่พบแผนก"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มแผนก
          </Button>
        }
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
                    formData.departmentDivision
                      ? [formData.departmentDivision]
                      : []
                  }
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0] || "";
                    setFormData({ ...formData, departmentDivision: val });
                  }}
                >
                  {divisions.map((div) => (
                    <SelectItem key={div.divisionName}>
                      {div.divisionName}
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
                  value={formData.departmentName}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentName: e.target.value })
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
                  value={formData.departmentDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      departmentDescription: e.target.value,
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
              onPress={handleSave}
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
              <span className="font-semibold">
                {deletingDept?.departmentName}
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
