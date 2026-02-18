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
} from "@/actions/hr";

const emptyForm = {
  employeeFirstName: "",
  employeeLastName: "",
  employeeEmail: "",
  employeePhone: "",
  employeeDivision: "",
  employeeDepartment: "",
  employeePosition: "",
  employeeStatus: "active",
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
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        employeeFirstName: employee.employeeFirstName || "",
        employeeLastName: employee.employeeLastName || "",
        employeeEmail: employee.employeeEmail || "",
        employeePhone: employee.employeePhone || "",
        employeeDivision: employee.employeeDivision || "",
        employeeDepartment: employee.employeeDepartment || "",
        employeePosition: employee.employeePosition || "",
        employeeStatus: employee.employeeStatus || "active",
      });
    } else {
      setEditingEmployee(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.employeeFirstName.trim() ||
      !formData.employeeLastName.trim()
    ) {
      toast.error("First name and last name are required");
      return;
    }

    try {
      setSaving(true);
      if (editingEmployee) {
        await updateEmployee(editingEmployee.employeeId, formData);
        toast.success("Employee updated");
      } else {
        await createEmployee(formData);
        toast.success("Employee created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save employee");
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
      await deleteEmployee(deletingEmployee.employeeId);
      toast.success("Employee deleted");
      deleteModal.onClose();
      setDeletingEmployee(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete employee");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
  };
}
