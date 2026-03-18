"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { get, post, put, del } from "@/lib/apiClient";
import ActionsView from "@/modules/rbac/components/ActionsView";

export default function ActionsClient({ initialActions }) {
  const [actions, setActions] = useState(initialActions);
  const [loading, setLoading] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [formData, setFormData] = useState({
    rbacActionName: "",
    rbacActionDescription: "",
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await get("/api/rbac/actions");
      setActions(data);
    } catch (error) {
      toast.error("โหลดแอคชันล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (action = null) => {
    if (action) {
      setEditingAction(action);
      setFormData({
        rbacActionName: action.rbacActionName,
        rbacActionDescription: action.rbacActionDescription || "",
      });
    } else {
      setEditingAction(null);
      setFormData({ rbacActionName: "", rbacActionDescription: "" });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.rbacActionName.trim()) {
      toast.error("กรุณาระบุชื่อแอคชัน");
      return;
    }

    try {
      if (editingAction) {
        await put(
          `/api/rbac/actions/${editingAction.rbacActionId}`,
          formData
        );
        toast.success("อัปเดตแอคชันสำเร็จ");
      } else {
        await post("/api/rbac/actions", formData);
        toast.success("สร้างแอคชันสำเร็จ");
      }
      onClose();
      loadActions();
    } catch (error) {
      toast.error(error.message || "บันทึกแอคชันล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/rbac/actions/${item.rbacActionId}`, {
        isActive: !item.isActive,
      });
      toast.success(
        item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ"
      );
      loadActions();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const handleDelete = async (action) => {
    try {
      await del(`/api/rbac/actions/${action.rbacActionId}`);
      toast.success("ลบแอคชันสำเร็จ");
      loadActions();
    } catch (error) {
      toast.error(error.message || "ลบแอคชันล้มเหลว");
    }
  };

  return (
    <ActionsView
      actions={actions}
      loading={loading}
      editingAction={editingAction}
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
