"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDivisions,
  getDepartments,
  getPositions,
} from "@/modules/hr/actions";

const emptyForm = {
  hrEmployeeFirstName: "",
  hrEmployeeLastName: "",
  hrEmployeeEmail: "",
  hrEmployeePhone: "",
  hrEmployeeDivision: "",
  hrEmployeeDepartment: "",
  hrEmployeePosition: "",
  hrEmployeeStatus: "active",
};

export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingEmployee, setDeletingEmployee] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empData, divData, deptData, posData] = await Promise.all([
        getEmployees(),
        getDivisions(),
        getDepartments(),
        getPositions(),
      ]);
      setEmployees(empData);
      setDivisions(divData);
      setDepartments(deptData);
      setPositions(posData);
    } catch (error) {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        hrEmployeeFirstName: employee.hrEmployeeFirstName || "",
        hrEmployeeLastName: employee.hrEmployeeLastName || "",
        hrEmployeeEmail: employee.hrEmployeeEmail || "",
        hrEmployeePhone: employee.hrEmployeePhone || "",
        hrEmployeeDivision: employee.hrEmployeeDivision || "",
        hrEmployeeDepartment: employee.hrEmployeeDepartment || "",
        hrEmployeePosition: employee.hrEmployeePosition || "",
        hrEmployeeStatus: employee.hrEmployeeStatus || "active",
      });
    } else {
      setEditingEmployee(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.hrEmployeeFirstName.trim() ||
      !formData.hrEmployeeLastName.trim()
    ) {
      toast.error("กรุณาระบุชื่อและนามสกุล");
      return;
    }

    try {
      setSaving(true);
      if (editingEmployee) {
        await updateEmployee(editingEmployee.hrEmployeeId, formData);
        toast.success("อัปเดตพนักงานสำเร็จ");
      } else {
        await createEmployee(formData);
        toast.success("สร้างพนักงานสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกพนักงานล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (employee) => {
    setDeletingEmployee(employee);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    try {
      await deleteEmployee(deletingEmployee.hrEmployeeId);
      toast.success("ลบพนักงานสำเร็จ");
      deleteModal.onClose();
      setDeletingEmployee(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบพนักงานล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleActive = async (item) => {
    try {
      await updateEmployee(item.hrEmployeeId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadData();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  return {
    employees,
    divisions,
    departments,
    positions,
    loading,
    saving,
    editingEmployee,
    formData,
    deletingEmployee,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    toggleActive,
  };
}
