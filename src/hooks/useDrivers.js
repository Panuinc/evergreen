"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from "@/actions/tms";
import { getEmployees } from "@/actions/hr";

const emptyForm = {
  driverFirstName: "",
  driverLastName: "",
  driverPhone: "",
  driverLicenseNumber: "",
  driverLicenseType: "type2",
  driverLicenseExpiry: "",
  driverRole: "driver",
  driverStatus: "available",
  driverEmployeeId: "",
  driverNotes: "",
};

export function useDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingDriver, setDeletingDriver] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [driverData, empData] = await Promise.all([
        getDrivers(),
        getEmployees(),
      ]);
      setDrivers(driverData);
      setEmployees(empData);
    } catch (error) {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        driverFirstName: driver.driverFirstName || "",
        driverLastName: driver.driverLastName || "",
        driverPhone: driver.driverPhone || "",
        driverLicenseNumber: driver.driverLicenseNumber || "",
        driverLicenseType: driver.driverLicenseType || "type2",
        driverLicenseExpiry: driver.driverLicenseExpiry || "",
        driverRole: driver.driverRole || "driver",
        driverStatus: driver.driverStatus || "available",
        driverEmployeeId: driver.driverEmployeeId?.toString() || "",
        driverNotes: driver.driverNotes || "",
      });
    } else {
      setEditingDriver(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.driverFirstName.trim() ||
      !formData.driverLastName.trim()
    ) {
      toast.error("กรุณาระบุชื่อและนามสกุล");
      return;
    }

    try {
      setSaving(true);
      if (editingDriver) {
        await updateDriver(editingDriver.driverId, formData);
        toast.success("อัปเดตพนักงานขับรถสำเร็จ");
      } else {
        await createDriver(formData);
        toast.success("สร้างพนักงานขับรถสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกพนักงานขับรถล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (driver) => {
    setDeletingDriver(driver);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingDriver) return;
    try {
      await deleteDriver(deletingDriver.driverId);
      toast.success("ลบพนักงานขับรถสำเร็จ");
      deleteModal.onClose();
      setDeletingDriver(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบพนักงานขับรถล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    drivers,
    employees,
    loading,
    saving,
    editingDriver,
    formData,
    deletingDriver,
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
