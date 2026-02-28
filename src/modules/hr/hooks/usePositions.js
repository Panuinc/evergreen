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
} from "@/modules/hr/actions";

const emptyForm = {
  hrPositionTitle: "",
  hrPositionDescription: "",
  hrPositionDepartment: "",
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
      toast.error("โหลดตำแหน่งล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (pos = null) => {
    if (pos) {
      setEditingPos(pos);
      setFormData({
        hrPositionTitle: pos.hrPositionTitle || "",
        hrPositionDescription: pos.hrPositionDescription || "",
        hrPositionDepartment: pos.hrPositionDepartment || "",
      });
    } else {
      setEditingPos(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.hrPositionTitle.trim()) {
      toast.error("กรุณาระบุชื่อตำแหน่ง");
      return;
    }

    try {
      setSaving(true);
      if (editingPos) {
        await updatePosition(editingPos.hrPositionId, formData);
        toast.success("อัปเดตตำแหน่งสำเร็จ");
      } else {
        await createPosition(formData);
        toast.success("สร้างตำแหน่งสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกตำแหน่งล้มเหลว");
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
      await deletePosition(deletingPos.hrPositionId);
      toast.success("ลบตำแหน่งสำเร็จ");
      deleteModal.onClose();
      setDeletingPos(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบตำแหน่งล้มเหลว");
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
