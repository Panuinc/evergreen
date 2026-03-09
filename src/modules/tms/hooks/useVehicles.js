"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/modules/tms/actions";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  tmsVehiclePlateNumber: "",
  tmsVehicleCapacityKg: "",
  tmsVehicleWidth: "",
  tmsVehicleLength: "",
  tmsVehicleHeight: "",
  tmsVehicleFuelType: "diesel",
  tmsVehicleStatus: "available",
  tmsVehicleFuelConsumptionRate: "",
  tmsVehicleForthtrackId: "",
};

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingVehicle, setDeletingVehicle] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getVehicles();
      setVehicles(data);
    } catch (error) {
      toast.error("โหลดยานพาหนะล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (vehicle = null) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setFormData({
        tmsVehiclePlateNumber: vehicle.tmsVehiclePlateNumber || "",
        tmsVehicleCapacityKg: vehicle.tmsVehicleCapacityKg?.toString() || "",
        tmsVehicleWidth: vehicle.tmsVehicleWidth?.toString() || "",
        tmsVehicleLength: vehicle.tmsVehicleLength?.toString() || "",
        tmsVehicleHeight: vehicle.tmsVehicleHeight?.toString() || "",
        tmsVehicleFuelType: vehicle.tmsVehicleFuelType || "diesel",
        tmsVehicleStatus: vehicle.tmsVehicleStatus || "available",
        tmsVehicleFuelConsumptionRate: vehicle.tmsVehicleFuelConsumptionRate?.toString() || "",
        tmsVehicleForthtrackId: vehicle.tmsVehicleForthtrackId || "",
      });
    } else {
      setEditingVehicle(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const [validationErrors, setValidationErrors] = useState({});

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      tmsVehiclePlateNumber: [(v) => !isRequired(v) && "กรุณาระบุหมายเลขทะเบียน"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      if (editingVehicle) {
        await updateVehicle(editingVehicle.tmsVehicleId, formData);
        toast.success("อัปเดตยานพาหนะสำเร็จ");
      } else {
        await createVehicle(formData);
        toast.success("สร้างยานพาหนะสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกยานพาหนะล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (vehicle) => {
    setDeletingVehicle(vehicle);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingVehicle) return;
    try {
      await deleteVehicle(deletingVehicle.tmsVehicleId);
      toast.success("ลบยานพาหนะสำเร็จ");
      deleteModal.onClose();
      setDeletingVehicle(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบยานพาหนะล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateVehicle(item.tmsVehicleId, { isActive: !item.isActive });
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
    vehicles,
    loading,
    saving,
    editingVehicle,
    formData,
    validationErrors,
    deletingVehicle,
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
