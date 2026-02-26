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
import { useActions } from "@/hooks/rbac/useActions";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อ", uid: "rbacActionName", sortable: true },
  { name: "รายละเอียด", uid: "rbacActionDescription" },
  { name: "สร้างเมื่อ", uid: "rbacActionCreatedAt", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "rbacActionName",
  "rbacActionDescription",
  "rbacActionCreatedAt",
  "actions",
];

export default function ActionsPage() {
  const {
    actions,
    loading,
    editingAction,
    formData,
    setFormData,
    isOpen,
    onClose,
    handleOpen,
    handleSave,
    handleDelete,
  } = useActions();

  const renderCell = useCallback(
    (action, columnKey) => {
      switch (columnKey) {
        case "rbacActionName":
          return <span className="font-medium">{action.rbacActionName}</span>;
        case "rbacActionDescription":
          return (
            <span className="text-default-500">
              {action.rbacActionDescription || "-"}
            </span>
          );
        case "rbacActionCreatedAt":
          return (
            <span className="text-default-500">
              {new Date(action.rbacActionCreatedAt).toLocaleDateString()}
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
                onPress={() => handleOpen(action)}
              >
                <Edit />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleDelete(action)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return action[columnKey] || "-";
      }
    },
    [handleOpen, handleDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={actions}
        renderCell={renderCell}
        enableCardView
        rowKey="rbacActionId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามชื่อ, รายละเอียด..."
        searchKeys={["rbacActionName", "rbacActionDescription"]}
        emptyContent="ไม่พบการดำเนินการ"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            เพิ่มการดำเนินการ
          </Button>
        }
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingAction ? "แก้ไขการดำเนินการ" : "สร้างการดำเนินการ"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="ชื่อ"
                  labelPlacement="outside"
                  placeholder="เช่น create, read, update, delete"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.rbacActionName}
                  onChange={(e) =>
                    setFormData({ ...formData, rbacActionName: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายการดำเนินการนี้..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.rbacActionDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rbacActionDescription: e.target.value,
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
            <Button variant="bordered" size="md" radius="md" onPress={handleSave}>
              {editingAction ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
