"use client";

import { useState, useEffect, useCallback } from "react";
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
  useDisclosure,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
} from "@/actions/rbac";
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
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    resourceName: "",
    resourceModuleId: "",
    resourceDescription: "",
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await getResources();
      setResources(data);
    } catch (error) {
      toast.error("Failed to load resources");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        resourceName: resource.resourceName,
        resourceModuleId: resource.resourceModuleId || "",
        resourceDescription: resource.resourceDescription || "",
      });
    } else {
      setEditingResource(null);
      setFormData({
        resourceName: "",
        resourceModuleId: "",
        resourceDescription: "",
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.resourceName.trim()) {
      toast.error("Resource name is required");
      return;
    }

    try {
      if (editingResource) {
        await updateResource(editingResource.resourceId, formData);
        toast.success("Resource updated");
      } else {
        await createResource(formData);
        toast.success("Resource created");
      }
      onClose();
      loadResources();
    } catch (error) {
      toast.error(error.message || "Failed to save resource");
    }
  };

  const handleDelete = async (resource) => {
    try {
      await deleteResource(resource.resourceId);
      toast.success("Resource deleted");
      loadResources();
    } catch (error) {
      toast.error(error.message || "Failed to delete resource");
    }
  };

  const renderCell = useCallback((resource, columnKey) => {
    switch (columnKey) {
      case "resourceName":
        return (
          <span className="font-medium">{resource.resourceName}</span>
        );
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
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => handleOpen(resource)}
            >
              <Edit />
            </Button>
            <Button
              isIconOnly
              variant="light"
              size="sm"
              color="danger"
              onPress={() => handleDelete(resource)}
            >
              <Trash2 />
            </Button>
          </div>
        );
      default:
        return resource[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={resources}
        renderCell={renderCell}
        rowKey="resourceId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by name, module, description..."
        searchKeys={[
          "resourceName",
          "resourceModuleId",
          "resourceDescription",
        ]}
        emptyContent="No resources found"
        topEndContent={
          <Button
            color="primary"
            size="sm"
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
            <Input
              label="Name"
              placeholder="e.g. employees"
              value={formData.resourceName}
              onChange={(e) =>
                setFormData({ ...formData, resourceName: e.target.value })
              }
              variant="bordered"
            />
            <Select
              label="Module"
              placeholder="Select a module"
              selectedKeys={
                formData.resourceModuleId
                  ? [formData.resourceModuleId]
                  : []
              }
              onSelectionChange={(keys) =>
                setFormData({
                  ...formData,
                  resourceModuleId: Array.from(keys)[0] || "",
                })
              }
              variant="bordered"
            >
              {menuData.map((menu) => (
                <SelectItem key={menu.id}>{menu.name}</SelectItem>
              ))}
            </Select>
            <Textarea
              label="Description"
              placeholder="Describe this resource..."
              value={formData.resourceDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  resourceDescription: e.target.value,
                })
              }
              variant="bordered"
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSave}>
              {editingResource ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
