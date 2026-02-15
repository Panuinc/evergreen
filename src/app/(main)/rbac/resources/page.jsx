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
import { Card, CardBody, CardFooter } from "@heroui/react";
import { useResources } from "@/hooks/useResources";
import { menuData } from "@/config/menu";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Name", uid: "resourceName", sortable: true },
  { name: "Module", uid: "resourceModuleId", sortable: true },
  { name: "Description", uid: "resourceDescription" },
  { name: "Actions", uid: "actions" },
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

  const renderCell = useCallback((resource, columnKey) => {
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
  }, [handleOpen, handleDelete]);

  const renderCard = useCallback((resource) => (
    <Card key={resource.resourceId} variant="bordered" radius="md" shadow="none">
      <CardBody className="gap-3">
        <span className="font-semibold text-lg">{resource.resourceName}</span>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-default-400">Module</span>
            <span className="text-default-500">{resource.resourceModuleId || "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-400">Description</span>
            <span className="text-default-500">{resource.resourceDescription || "-"}</span>
          </div>
        </div>
      </CardBody>
      <CardFooter className="gap-1 justify-end">
        <Button variant="bordered" size="md" radius="md" isIconOnly onPress={() => handleOpen(resource)}>
          <Edit />
        </Button>
        <Button variant="bordered" size="md" radius="md" isIconOnly onPress={() => handleDelete(resource)}>
          <Trash2 />
        </Button>
      </CardFooter>
    </Card>
  ), [handleOpen, handleDelete]);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={resources}
        renderCell={renderCell}
        renderCard={renderCard}
        rowKey="resourceId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, module, description..."
        searchKeys={["resourceName", "resourceModuleId", "resourceDescription"]}
        emptyContent="No resources found"
        topEndContent={
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<Plus />}
            onPress={() => handleOpen()}
          >
            Add Resource
          </Button>
        }
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            {editingResource ? "Edit Resource" : "Create Resource"}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center w-full h-fit p-2 gap-2">
                <Input
                  label="Name"
                  labelPlacement="outside"
                  placeholder="e.g. employees"
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
                  label="Module"
                  labelPlacement="outside"
                  placeholder="Select a module"
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
                  label="Description"
                  labelPlacement="outside"
                  placeholder="Describe this resource..."
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
              Cancel
            </Button>
            <Button variant="solid" size="md" radius="md" onPress={handleSave}>
              {editingResource ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
