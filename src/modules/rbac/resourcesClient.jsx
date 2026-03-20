"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { get, post, put, del } from "@/lib/apiClient";
import ResourcesView from "@/modules/rbac/components/resourcesView";

export default function ResourcesClient({ initialResources }) {
  const [resources, setResources] = useState(initialResources);
  const [loading, setLoading] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    rbacResourceName: "",
    rbacResourceModuleRef: "",
    rbacResourceDescription: "",
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await get("/api/rbac/resources");
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
        rbacResourceModuleRef: resource.rbacResourceModuleRef || "",
        rbacResourceDescription: resource.rbacResourceDescription || "",
      });
    } else {
      setEditingResource(null);
      setFormData({
        rbacResourceName: "",
        rbacResourceModuleRef: "",
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
        await put(
          `/api/rbac/resources/${editingResource.rbacResourceId}`,
          formData
        );
        toast.success("อัปเดตทรัพยากรสำเร็จ");
      } else {
        await post("/api/rbac/resources", formData);
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
      await put(`/api/rbac/resources/${item.rbacResourceId}`, {
        isActive: !item.isActive,
      });
      toast.success(
        item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ"
      );
      loadResources();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const handleDelete = async (resource) => {
    try {
      await del(`/api/rbac/resources/${resource.rbacResourceId}`);
      toast.success("ลบทรัพยากรสำเร็จ");
      loadResources();
    } catch (error) {
      toast.error(error.message || "ลบทรัพยากรล้มเหลว");
    }
  };

  return (
    <ResourcesView
      resources={resources}
      loading={loading}
      editingResource={editingResource}
      formData={formData}
      setFormData={setFormData}
      isOpen={isOpen}
      onClose={onClose}
      handleOpen={handleOpen}
      handleSave={handleSave}
      handleDelete={handleDelete}
      toggleActive={toggleActive}
    />
  );
}
