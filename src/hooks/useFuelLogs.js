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
  getDrivers,
} from "@/actions/tms";

const today = new Date().toISOString().split("T")[0];

const emptyForm = {
  fuelLogVehicleId: "",
  fuelLogDriverId: "",
  fuelLogDate: today,
  fuelLogFuelType: "diesel",
  fuelLogLiters: "",
  fuelLogPricePerLiter: "",
  fuelLogTotalCost: "",
  fuelLogMileage: "",
  fuelLogStation: "",
  fuelLogNotes: "",
  fuelLogReceiptUrl: "",
};

export function useFuelLogs() {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
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
      const [fuelData, vehData, drvData] = await Promise.all([
        getFuelLogs(),
        getVehicles(),
        getDrivers(),
      ]);
      setFuelLogs(fuelData);
      setVehicles(vehData);
      setDrivers(drvData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (fuelLog = null) => {
    if (fuelLog) {
      setEditingFuelLog(fuelLog);
      setFormData({
        fuelLogVehicleId: fuelLog.fuelLogVehicleId?.toString() || "",
        fuelLogDriverId: fuelLog.fuelLogDriverId?.toString() || "",
        fuelLogDate: fuelLog.fuelLogDate || today,
        fuelLogFuelType: fuelLog.fuelLogFuelType || "diesel",
        fuelLogLiters: fuelLog.fuelLogLiters?.toString() || "",
        fuelLogPricePerLiter: fuelLog.fuelLogPricePerLiter?.toString() || "",
        fuelLogTotalCost: fuelLog.fuelLogTotalCost?.toString() || "",
        fuelLogMileage: fuelLog.fuelLogMileage?.toString() || "",
        fuelLogStation: fuelLog.fuelLogStation || "",
        fuelLogNotes: fuelLog.fuelLogNotes || "",
        fuelLogReceiptUrl: fuelLog.fuelLogReceiptUrl || "",
      });
    } else {
      setEditingFuelLog(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.fuelLogVehicleId ||
      !formData.fuelLogLiters ||
      !formData.fuelLogPricePerLiter
    ) {
      toast.error("Vehicle, liters, and price per liter are required");
      return;
    }

    const payload = {
      ...formData,
      fuelLogLiters: parseFloat(formData.fuelLogLiters),
      fuelLogPricePerLiter: parseFloat(formData.fuelLogPricePerLiter),
      fuelLogTotalCost: formData.fuelLogTotalCost
        ? parseFloat(formData.fuelLogTotalCost)
        : null,
      fuelLogMileage: formData.fuelLogMileage
        ? parseFloat(formData.fuelLogMileage)
        : null,
    };

    try {
      setSaving(true);
      if (editingFuelLog) {
        await updateFuelLog(editingFuelLog.fuelLogId, payload);
        toast.success("Fuel log updated");
      } else {
        await createFuelLog(payload);
        toast.success("Fuel log created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save fuel log");
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
      await deleteFuelLog(deletingFuelLog.fuelLogId);
      toast.success("Fuel log deleted");
      deleteModal.onClose();
      setDeletingFuelLog(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete fuel log");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    fuelLogs,
    vehicles,
    drivers,
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
  };
}
