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
} from "@/modules/hr/actions";

const emptyForm = {
  hrDepartmentName: "",
  hrDepartmentDescription: "",
  hrDepartmentDivision: "",
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
        hrDepartmentName: dept.hrDepartmentName || "",
        hrDepartmentDescription: dept.hrDepartmentDescription || "",
        hrDepartmentDivision: dept.hrDepartmentDivision || "",
      });
    } else {
      setEditingDept(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (!formData.hrDepartmentName.trim()) {
      toast.error("กรุณาระบุชื่อแผนก");
      return;
    }

    try {
      setSaving(true);
      if (editingDept) {
        await updateDepartment(editingDept.hrDepartmentId, formData);
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
      await deleteDepartment(deletingDept.hrDepartmentId);
      toast.success("ลบแผนกสำเร็จ");
      deleteModal.onClose();
      setDeletingDept(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบแผนกล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateDepartment(item.hrDepartmentId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadData();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
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
    toggleActive,
  };
}
