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
import { useResources } from "@/hooks/useResources";
import { menuData } from "@/config/menu";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "ชื่อ", uid: "resourceName", sortable: true },
  { name: "โมดูล", uid: "resourceModuleId", sortable: true },
  { name: "รายละเอียด", uid: "resourceDescription" },
  { name: "การดำเนินการ", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "resourceName",
  "resourceModuleId",
  "resourceDescription",
  "actions",
];

export default function ResourcesPage() {
  const {
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
  } = useResources();

  const renderCell = useCallback(
    (resource, columnKey) => {
      switch (columnKey) {
        case "resourceName":
          return <span className="font-medium">{resource.resourceName}</span>;
        case "resourceModuleId":
          return (
            <span className="text-default-500">
              {resource.resourceModuleId || "-"}
            </span>
          );
        case "resourceDescription":
          return (
            <span className="text-default-500">
              {resource.resourceDescription || "-"}
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
                onPress={() => handleOpen(resource)}
              >
                <Edit />
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                isIconOnly
                onPress={() => handleDelete(resource)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        default:
          return resource[columnKey] || "-";
      }
    },
    [handleOpen, handleDelete],
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={resources}
        renderCell={renderCell}
        enableCardView
        rowKey="resourceId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาตามชื่อ, โมดูล, รายละเอียด..."
        searchKeys={["resourceName", "resourceModuleId", "resourceDescription"]}
        emptyContent="ไม่พบทรัพยากร"
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
                  value={formData.resourceName}
                  onChange={(e) =>
                    setFormData({ ...formData, resourceName: e.target.value })
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
                    formData.resourceModuleId ? [formData.resourceModuleId] : []
                  }
                  onSelectionChange={(keys) =>
                    setFormData({
                      ...formData,
                      resourceModuleId: Array.from(keys)[0] || "",
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
                  value={formData.resourceDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      resourceDescription: e.target.value,
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
            <Button variant="solid" size="md" radius="md" onPress={handleSave}>
              {editingResource ? "อัปเดต" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
