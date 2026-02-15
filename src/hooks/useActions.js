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
      toast.error("Failed to load actions");
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
      toast.error("Action name is required");
      return;
    }

    try {
      if (editingAction) {
        await updateAction(editingAction.actionId, formData);
        toast.success("Action updated");
      } else {
        await createAction(formData);
        toast.success("Action created");
      }
      onClose();
      loadActions();
    } catch (error) {
      toast.error(error.message || "Failed to save action");
    }
  };

  const handleDelete = async (action) => {
    try {
      await deleteAction(action.actionId);
      toast.success("Action deleted");
      loadActions();
    } catch (error) {
      toast.error(error.message || "Failed to delete action");
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
