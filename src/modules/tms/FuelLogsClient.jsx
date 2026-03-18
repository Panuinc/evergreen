"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import FuelLogsView from "@/modules/tms/components/FuelLogsView";

const today = new Date().toISOString().split("T")[0];

const emptyForm = {
  tmsFuelLogVehicleId: "",
  tmsFuelLogDate: today,
  tmsFuelLogFuelType: "diesel",
  tmsFuelLogLiters: "",
  tmsFuelLogPricePerLiter: "",
  tmsFuelLogReceiptUrl: "",
};

export default function FuelLogsClient({ initialFuelLogs, initialVehicles }) {
  const [fuelLogs, setFuelLogs] = useState(initialFuelLogs);
  const [vehicles] = useState(initialVehicles);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingFuelLog, setEditingFuelLog] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingFuelLog, setDeletingFuelLog] = useState(null);

  const reload = async () => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const [fuelData, vehData] = await Promise.all([
        get("/api/tms/fuelLogs"),
        get("/api/tms/vehicles"),
      ]);
      setFuelLogs(fuelData);
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
        await put(`/api/tms/fuelLogs/${editingFuelLog.tmsFuelLogId}`, payload);
        toast.success("อัปเดตบันทึกเชื้อเพลิงสำเร็จ");
      } else {
        await post("/api/tms/fuelLogs", payload);
        toast.success("สร้างบันทึกเชื้อเพลิงสำเร็จ");
      }
      onClose();
      reload();
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
      await del(`/api/tms/fuelLogs/${deletingFuelLog.tmsFuelLogId}`);
      toast.success("ลบบันทึกเชื้อเพลิงสำเร็จ");
      deleteModal.onClose();
      setDeletingFuelLog(null);
      reload();
    } catch (error) {
      toast.error(error.message || "ลบบันทึกเชื้อเพลิงล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/tms/fuelLogs/${item.tmsFuelLogId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reload();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <FuelLogsView
      fuelLogs={fuelLogs}
      vehicles={vehicles}
      loading={loading}
      saving={saving}
      editingFuelLog={editingFuelLog}
      formData={formData}
      deletingFuelLog={deletingFuelLog}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      toggleActive={toggleActive}
    />
  );
}
