"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDivisions,
} from "@/actions/hr";

const emptyForm = {
  departmentName: "",
  departmentDescription: "",
  departmentDivision: "",
};

export function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingDept, setDeletingDept] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [deptData, divData] = await Promise.all([
        getDepartments(),
        getDivisions(),
      ]);
      setDepartments(deptData);
      setDivisions(divData);
    } catch (error) {
      toast.error("โหลดข้อมูลล้มเหลว");
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
        departmentDivision: dept.departmentDivision || "",
      });
    } else {
      setEditingDept(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.departmentName.trim()) {
      toast.error("กรุณาระบุชื่อแผนก");
      return;
    }

    try {
      setSaving(true);
      if (editingDept) {
        await updateDepartment(editingDept.departmentId, formData);
        toast.success("อัปเดตแผนกสำเร็จ");
      } else {
        await createDepartment(formData);
        toast.success("สร้างแผนกสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกแผนกล้มเหลว");
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
      toast.success("ลบแผนกสำเร็จ");
      deleteModal.onClose();
      setDeletingDept(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบแผนกล้มเหลว");
    }
  };

  return {
    departments,
    divisions,
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
