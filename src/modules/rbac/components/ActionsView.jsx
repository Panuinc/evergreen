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
  Textarea,
  Chip,
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "ชื่อ", uid: "rbacActionName", sortable: true },
  { name: "รายละเอียด", uid: "rbacActionDescription" },
  { name: "สร้างเมื่อ", uid: "rbacActionCreatedAt", sortable: true },
  { name: "การดำเนินการ", uid: "actions" },
];

const BASE_VISIBLE_COLUMNS = [
  "rbacActionName",
  "rbacActionDescription",
  "rbacActionCreatedAt",
  "actions",
];

export default function ActionsView({
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
    (action, columnKey) => {
      switch (columnKey) {
        case "rbacActionName":
          return <span className="font-light">{action.rbacActionName}</span>;
        case "rbacActionDescription":
          return (
            <span className="text-muted-foreground">
              {action.rbacActionDescription || "-"}
            </span>
          );
        case "rbacActionCreatedAt":
          return (
            <span className="text-muted-foreground">
              {new Date(action.rbacActionCreatedAt).toLocaleDateString()}
            </span>
          );
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={action.isActive ? "success" : "danger"}
            >
              {action.isActive ? "Active" : "Inactive"}
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
                onPress={() => handleOpen(action)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={action.isActive}
                  onValueChange={() => toggleActive(action)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => handleDelete(action)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return action[columnKey] || "-";
      }
    },
    [handleOpen, handleDelete, toggleActive, isSuperAdmin],
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
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อ, รายละเอียด..."
        searchKeys={["rbacActionName", "rbacActionDescription"]}
        emptyContent="ไม่พบการดำเนินการ"
        actionMenuItems={(item) =>
          [
            { key: "edit", label: "แก้ไข", icon: <Edit size={16} />, onPress: () => handleOpen(item) },
            isSuperAdmin
              ? { key: "toggle", label: item.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน", icon: <Power size={16} />, onPress: () => toggleActive(item) }
              : { key: "delete", label: "ลบ", icon: <Trash2 size={16} />, color: "danger", onPress: () => handleDelete(item) },
          ].filter(Boolean)
        }
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
