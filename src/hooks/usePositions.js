"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getPositions,
  createPosition,
  updatePosition,
  deletePosition,
  getDepartments,
} from "@/actions/hr";

const emptyForm = {
  positionTitle: "",
  positionDescription: "",
  positionDepartment: "",
};

export function usePositions() {
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPos, setEditingPos] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingPos, setDeletingPos] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [posData, deptData] = await Promise.all([
        getPositions(),
        getDepartments(),
      ]);
      setPositions(posData);
      setDepartments(deptData);
    } catch {
      toast.error("Failed to load positions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (pos = null) => {
    if (pos) {
      setEditingPos(pos);
      setFormData({
        positionTitle: pos.positionTitle || "",
        positionDescription: pos.positionDescription || "",
        positionDepartment: pos.positionDepartment || "",
      });
    } else {
      setEditingPos(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.positionTitle.trim()) {
      toast.error("Position title is required");
      return;
    }

    try {
      setSaving(true);
      if (editingPos) {
        await updatePosition(editingPos.positionId, formData);
        toast.success("Position updated");
      } else {
        await createPosition(formData);
        toast.success("Position created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save position");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (pos) => {
    setDeletingPos(pos);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingPos) return;
    try {
      await deletePosition(deletingPos.positionId);
      toast.success("Position deleted");
      deleteModal.onClose();
      setDeletingPos(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete position");
    }
  };

  return {
    positions,
    departments,
    loading,
    saving,
    editingPos,
    formData,
    setFormData,
    deletingPos,
    isOpen,
    onClose,
    deleteModal,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  };
}
