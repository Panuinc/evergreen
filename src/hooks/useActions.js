"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getActions,
  createAction,
  updateAction,
  deleteAction,
} from "@/actions/rbac";

export function useActions() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAction, setEditingAction] = useState(null);
  const [formData, setFormData] = useState({
    actionName: "",
    actionDescription: "",
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
        actionName: action.actionName,
        actionDescription: action.actionDescription || "",
      });
    } else {
      setEditingAction(null);
      setFormData({ actionName: "", actionDescription: "" });
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.actionName.trim()) {
      toast.error("กรุณาระบุชื่อแอคชัน");
      return;
    }

    try {
      if (editingAction) {
        await updateAction(editingAction.actionId, formData);
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

  const handleDelete = async (action) => {
    try {
      await deleteAction(action.actionId);
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
  };
}
