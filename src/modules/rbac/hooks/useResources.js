"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getResources,
  createResource,
  updateResource,
  deleteResource,
} from "@/modules/rbac/actions";

export function useResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    rbacResourceName: "",
    rbacResourceModuleId: "",
    rbacResourceDescription: "",
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
      toast.error("โหลดทรัพยากรล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      setFormData({
        rbacResourceName: resource.rbacResourceName,
        rbacResourceModuleId: resource.rbacResourceModuleId || "",
        rbacResourceDescription: resource.rbacResourceDescription || "",
      });
    } else {
      setEditingResource(null);
      setFormData({
        rbacResourceName: "",
        rbacResourceModuleId: "",
        rbacResourceDescription: "",
      });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.rbacResourceName.trim()) {
      toast.error("กรุณาระบุชื่อทรัพยากร");
      return;
    }

    try {
      if (editingResource) {
        await updateResource(editingResource.rbacResourceId, formData);
        toast.success("อัปเดตทรัพยากรสำเร็จ");
      } else {
        await createResource(formData);
        toast.success("สร้างทรัพยากรสำเร็จ");
      }
      onClose();
      loadResources();
    } catch (error) {
      toast.error(error.message || "บันทึกทรัพยากรล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateResource(item.rbacResourceId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadResources();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const handleDelete = async (resource) => {
    try {
      await deleteResource(resource.rbacResourceId);
      toast.success("ลบทรัพยากรสำเร็จ");
      loadResources();
    } catch (error) {
      toast.error(error.message || "ลบทรัพยากรล้มเหลว");
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
    toggleActive,
  };
}
