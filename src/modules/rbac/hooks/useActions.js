"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getActions,
  createAction,
  updateAction,
  deleteAction,
} from "@/modules/rbac/actions";

export function useActions() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAction, setEditingAction] = useState(null);
  const [formData, setFormData] = useState({
    rbacActionName: "",
    rbacActionDescription: "",
  });
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    try {
      setLoading(true);
      const data = await getActions();
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
        await updateAction(editingAction.rbacActionId, formData);
        toast.success("อัปเดตแอคชันสำเร็จ");
      } else {
        await createAction(formData);
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
      await updateAction(item.rbacActionId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadActions();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const handleDelete = async (action) => {
    try {
      await deleteAction(action.rbacActionId);
      toast.success("ลบแอคชันสำเร็จ");
      loadActions();
    } catch (error) {
      toast.error(error.message || "ลบแอคชันล้มเหลว");
    }
  };

  return {
    actions,
    loading,
    editingAction,
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
