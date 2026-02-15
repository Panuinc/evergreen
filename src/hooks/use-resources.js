"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
} from "@/actions/rbac";

export function useResources() {
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

  return {
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
  };
}
