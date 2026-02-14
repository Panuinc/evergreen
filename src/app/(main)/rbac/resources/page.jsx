"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
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
  Spinner,
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getResources, createResource, updateResource, deleteResource } from "@/actions/rbac";
import { menuData } from "@/config/menu";

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
      setFormData({ resourceName: "", resourceModuleId: "", resourceDescription: "" });
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

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-lg font-semibold">Resources</h1>
        <Button
          color="primary"
          variant="flat"
          size="sm"
          startContent={<Plus />}
          onPress={() => handleOpen()}
        >
          Add Resource
        </Button>
      </div>

      <Table aria-label="Resources table">
        <TableHeader>
          <TableColumn>Name</TableColumn>
          <TableColumn>Module</TableColumn>
          <TableColumn>Description</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody
          isLoading={loading}
          loadingContent={<Spinner size="sm" />}
          emptyContent="No resources found"
        >
          {resources.map((resource) => (
            <TableRow key={resource.resourceId}>
              <TableCell className="font-medium">{resource.resourceName}</TableCell>
              <TableCell className="text-default-500">
                {resource.resourceModuleId || "-"}
              </TableCell>
              <TableCell className="text-default-500">
                {resource.resourceDescription || "-"}
              </TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
              selectedKeys={formData.resourceModuleId ? [formData.resourceModuleId] : []}
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
                setFormData({ ...formData, resourceDescription: e.target.value })
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
