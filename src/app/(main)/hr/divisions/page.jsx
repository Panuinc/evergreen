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
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useDivisions } from "@/hooks/useDivisions";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อ", uid: "divisionName", sortable: true },
  { name: "รายละเอียด", uid: "divisionDescription" },
  { name: "วันที่สร้าง", uid: "divisionCreatedAt", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "divisionName",
  "divisionDescription",
  "divisionCreatedAt",
  "actions",
];

export default function DivisionsPage() {
  const {
    divisions,
    loading,
    saving,
    editingDiv,
    formData,
    setFormData,
    deletingDiv,
    isOpen,
    onClose,
    deleteModal,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  } = useDivisions();

  const renderCell = useCallback(
    (div, columnKey) => {
      switch (columnKey) {
        case "divisionName":
          return <span className="font-medium">{div.divisionName}</span>;
        case "divisionDescription":
          return (
            <span className="text-default-500">
              {div.divisionDescription || "-"}
            </span>
          );
        case "divisionCreatedAt":
          return (
            <span className="text-default-500">
              {new Date(div.divisionCreatedAt).toLocaleDateString("th-TH")}
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
                onPress={() => handleOpen(div)}
              >
                <Edit />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => confirmDelete(div)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return div[columnKey] || "-";
      }
    },
    [handleOpen, confirmDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={divisions}
        renderCell={renderCell}
        enableCardView
        rowKey="divisionId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามชื่อ, รายละเอียด..."
        searchKeys={["divisionName", "divisionDescription"]}
        emptyContent="ไม่พบฝ่าย"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มฝ่าย
          </Button>
        }
      />

      {/* Create/Edit Modal */}
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
                  value={formData.divisionName}
                  onChange={(e) =>
                    setFormData({ ...formData, divisionName: e.target.value })
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
                  value={formData.divisionDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      divisionDescription: e.target.value,
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
              {editingDiv ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal.isOpen} onClose={deleteModal.onClose}>
        <ModalContent>
          <ModalHeader>ลบฝ่าย</ModalHeader>
          <ModalBody>
            <p>
              คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
              <span className="font-semibold">
                {deletingDiv?.divisionName}
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
