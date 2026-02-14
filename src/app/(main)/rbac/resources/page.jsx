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
    name: "",
    module_id: "",
    description: "",
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
        name: resource.name,
        module_id: resource.module_id || "",
        description: resource.description || "",
      });
    } else {
      setEditingResource(null);
      setFormData({ name: "", module_id: "", description: "" });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Resource name is required");
      return;
    }

    try {
      if (editingResource) {
        await updateResource(editingResource.id, formData);
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
      await deleteResource(resource.id);
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
          startContent={<Plus className="w-4 h-4" />}
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
            <TableRow key={resource.id}>
              <TableCell className="font-medium">{resource.name}</TableCell>
              <TableCell className="text-default-500">
                {resource.module_id || "-"}
              </TableCell>
              <TableCell className="text-default-500">
                {resource.description || "-"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => handleOpen(resource)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    color="danger"
                    onPress={() => handleDelete(resource)}
                  >
                    <Trash2 className="w-4 h-4" />
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
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              variant="bordered"
            />
            <Select
              label="Module"
              placeholder="Select a module"
              selectedKeys={formData.module_id ? [formData.module_id] : []}
              onSelectionChange={(keys) =>
                setFormData({
                  ...formData,
                  module_id: Array.from(keys)[0] || "",
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
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
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
