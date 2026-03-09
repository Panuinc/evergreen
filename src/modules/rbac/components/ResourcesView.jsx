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
  Select,
  SelectItem,
  Chip,
  Switch,
} from "@heroui/react";
import { Plus, Edit, Trash2, Power } from "lucide-react";
import { menuData } from "@/config/menu";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";

const baseColumns = [
  { name: "ชื่อ", uid: "rbacResourceName", sortable: true },
  { name: "โมดูล", uid: "rbacResourceModuleId", sortable: true },
  { name: "รายละเอียด", uid: "rbacResourceDescription" },
  { name: "การดำเนินการ", uid: "actions" },
];

const BASE_VISIBLE_COLUMNS = [
  "rbacResourceName",
  "rbacResourceModuleId",
  "rbacResourceDescription",
  "actions",
];

export default function ResourcesView({
  resources,
  loading,
  editingResource,
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
    (resource, columnKey) => {
      switch (columnKey) {
        case "rbacResourceName":
          return <span className="font-light">{resource.rbacResourceName}</span>;
        case "rbacResourceModuleId":
          return (
            <span className="text-muted-foreground">
              {resource.rbacResourceModuleId || "-"}
            </span>
          );
        case "rbacResourceDescription":
          return (
            <span className="text-muted-foreground">
              {resource.rbacResourceDescription || "-"}
            </span>
          );
        case "isActive":
          return (
            <Chip
              variant="flat"
              size="md"
              radius="md"
              color={resource.isActive ? "success" : "danger"}
            >
              {resource.isActive ? "Active" : "Inactive"}
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
                onPress={() => handleOpen(resource)}
              >
                <Edit />
              </Button>
              {isSuperAdmin ? (
                <Switch
                  size="md"
                  isSelected={resource.isActive}
                  onValueChange={() => toggleActive(resource)}
                />
              ) : (
                <Button
                  variant="bordered"
                  size="md"
                  radius="md"
                  isIconOnly
                  onPress={() => handleDelete(resource)}
                >
                  <Trash2 />
                </Button>
              )}
            </div>
          );
        default:
          return resource[columnKey] || "-";
      }
    },
    [handleOpen, handleDelete, toggleActive, isSuperAdmin],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={resources}
        renderCell={renderCell}
        enableCardView
        rowKey="rbacResourceId"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาตามชื่อ, โมดูล, รายละเอียด..."
        searchKeys={["rbacResourceName", "rbacResourceModuleId", "rbacResourceDescription"]}
        emptyContent="ไม่พบทรัพยากร"
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
            เพิ่มทรัพยากร
          </Button>
        }
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingResource ? "แก้ไขทรัพยากร" : "สร้างทรัพยากร"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="ชื่อ"
                  labelPlacement="outside"
                  placeholder="เช่น employees"
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.rbacResourceName}
                  onChange={(e) =>
                    setFormData({ ...formData, rbacResourceName: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Select
                  label="โมดูล"
                  labelPlacement="outside"
                  placeholder="เลือกโมดูล"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={
                    formData.rbacResourceModuleId ? [formData.rbacResourceModuleId] : []
                  }
                  onSelectionChange={(keys) =>
                    setFormData({
                      ...formData,
                      rbacResourceModuleId: Array.from(keys)[0] || "",
                    })
                  }
                >
                  {menuData.map((menu) => (
                    <SelectItem key={menu.id}>{menu.name}</SelectItem>
                  ))}
                </Select>
              </div>
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Textarea
                  label="รายละเอียด"
                  labelPlacement="outside"
                  placeholder="อธิบายทรัพยากรนี้..."
                  variant="bordered"
                  size="md"
                  radius="md"
                  value={formData.rbacResourceDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rbacResourceDescription: e.target.value,
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
              {editingResource ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
