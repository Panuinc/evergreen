"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/actions/hr";

const emptyForm = {
  departmentName: "",
  departmentDescription: "",
};

export function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingDept, setDeletingDept] = useState(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setFormData({
        departmentName: dept.departmentName || "",
        departmentDescription: dept.departmentDescription || "",
      });
    } else {
      setEditingDept(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.departmentName.trim()) {
      toast.error("Department name is required");
      return;
    }

    try {
      setSaving(true);
      if (editingDept) {
        await updateDepartment(editingDept.departmentId, formData);
        toast.success("Department updated");
      } else {
        await createDepartment(formData);
        toast.success("Department created");
      }
      onClose();
      loadDepartments();
    } catch (error) {
      toast.error(error.message || "Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (dept) => {
    setDeletingDept(dept);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingDept) return;
    try {
      await deleteDepartment(deletingDept.departmentId);
      toast.success("Department deleted");
      deleteModal.onClose();
      setDeletingDept(null);
      loadDepartments();
    } catch (error) {
      toast.error(error.message || "Failed to delete department");
    }
  };

  return {
    departments,
    loading,
    saving,
    editingDept,
    formData,
    setFormData,
    deletingDept,
    isOpen,
    onClose,
    deleteModal,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
  };
}
