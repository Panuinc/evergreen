"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getFuelLogs,
  createFuelLog,
  updateFuelLog,
  deleteFuelLog,
  getVehicles,
} from "@/modules/tms/actions";

const today = new Date().toISOString().split("T")[0];

const emptyForm = {
  tmsFuelLogVehicleId: "",
  tmsFuelLogDate: today,
  tmsFuelLogFuelType: "diesel",
  tmsFuelLogLiters: "",
  tmsFuelLogPricePerLiter: "",
  tmsFuelLogReceiptUrl: "",
};

export function useFuelLogs() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingFuelLog, setEditingFuelLog] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingFuelLog, setDeletingFuelLog] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fuelData, vehData] = await Promise.all([
        getFuelLogs(),
        getVehicles(),
      ]);
      setFuelLogs(fuelData);
      setVehicles(vehData);
    } catch (error) {
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (fuelLog = null) => {
    if (fuelLog) {
      setEditingFuelLog(fuelLog);
      setFormData({
        tmsFuelLogVehicleId: fuelLog.tmsFuelLogVehicleId?.toString() || "",
        tmsFuelLogDate: fuelLog.tmsFuelLogDate || today,
        tmsFuelLogFuelType: fuelLog.tmsFuelLogFuelType || "diesel",
        tmsFuelLogLiters: fuelLog.tmsFuelLogLiters?.toString() || "",
        tmsFuelLogPricePerLiter: fuelLog.tmsFuelLogPricePerLiter?.toString() || "",
        tmsFuelLogReceiptUrl: fuelLog.tmsFuelLogReceiptUrl || "",
      });
    } else {
      setEditingFuelLog(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.tmsFuelLogVehicleId ||
      !formData.tmsFuelLogLiters ||
      !formData.tmsFuelLogPricePerLiter
    ) {
      toast.error("กรุณาระบุยานพาหนะ จำนวนลิตร และราคาต่อลิตร");
      return;
    }

    const liters = parseFloat(formData.tmsFuelLogLiters);
    const pricePerLiter = parseFloat(formData.tmsFuelLogPricePerLiter);

    const payload = {
      ...formData,
      tmsFuelLogLiters: liters,
      tmsFuelLogPricePerLiter: pricePerLiter,
      tmsFuelLogTotalCost: liters * pricePerLiter,
    };

    try {
      setSaving(true);
      if (editingFuelLog) {
        await updateFuelLog(editingFuelLog.tmsFuelLogId, payload);
        toast.success("อัปเดตบันทึกเชื้อเพลิงสำเร็จ");
      } else {
        await createFuelLog(payload);
        toast.success("สร้างบันทึกเชื้อเพลิงสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกเชื้อเพลิงล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (fuelLog) => {
    setDeletingFuelLog(fuelLog);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingFuelLog) return;
    try {
      await deleteFuelLog(deletingFuelLog.tmsFuelLogId);
      toast.success("ลบบันทึกเชื้อเพลิงสำเร็จ");
      deleteModal.onClose();
      setDeletingFuelLog(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบบันทึกเชื้อเพลิงล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateFuelLog(item.tmsFuelLogId, { isActive: !item.isActive });
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
    fuelLogs,
    vehicles,
    loading,
    saving,
    editingFuelLog,
    formData,
    deletingFuelLog,
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
