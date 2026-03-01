"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
} from "@/modules/tms/actions";
import { getEmployees } from "@/modules/hr/actions";

const emptyForm = {
  tmsDriverFirstName: "",
  tmsDriverLastName: "",
  tmsDriverPhone: "",
  tmsDriverLicenseNumber: "",
  tmsDriverLicenseType: "type2",
  tmsDriverLicenseExpiry: "",
  tmsDriverRole: "driver",
  tmsDriverStatus: "available",
  tmsDriverEmployeeId: "",
  tmsDriverNotes: "",
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
        tmsDriverFirstName: driver.tmsDriverFirstName || "",
        tmsDriverLastName: driver.tmsDriverLastName || "",
        tmsDriverPhone: driver.tmsDriverPhone || "",
        tmsDriverLicenseNumber: driver.tmsDriverLicenseNumber || "",
        tmsDriverLicenseType: driver.tmsDriverLicenseType || "type2",
        tmsDriverLicenseExpiry: driver.tmsDriverLicenseExpiry || "",
        tmsDriverRole: driver.tmsDriverRole || "driver",
        tmsDriverStatus: driver.tmsDriverStatus || "available",
        tmsDriverEmployeeId: driver.tmsDriverEmployeeId?.toString() || "",
        tmsDriverNotes: driver.tmsDriverNotes || "",
      });
    } else {
      setEditingDriver(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.tmsDriverFirstName.trim() ||
      !formData.tmsDriverLastName.trim()
    ) {
      toast.error("กรุณาระบุชื่อและนามสกุล");
      return;
    }

    try {
      setSaving(true);
      if (editingDriver) {
        await updateDriver(editingDriver.tmsDriverId, formData);
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
      await deleteDriver(deletingDriver.tmsDriverId);
      toast.success("ลบพนักงานขับรถสำเร็จ");
      deleteModal.onClose();
      setDeletingDriver(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบพนักงานขับรถล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateDriver(item.tmsDriverId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadData();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
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
    toggleActive,
  };
}
