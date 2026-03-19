"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import VehiclesView from "@/modules/tms/components/vehiclesView";

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

export default function VehiclesClient({ initialVehicles }) {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const reload = async () => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const data = await get("/api/tms/vehicles");
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
        await put(`/api/tms/vehicles/${editingVehicle.tmsVehicleId}`, formData);
        toast.success("อัปเดตยานพาหนะสำเร็จ");
      } else {
        await post("/api/tms/vehicles", formData);
        toast.success("สร้างยานพาหนะสำเร็จ");
      }
      onClose();
      reload();
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
      await del(`/api/tms/vehicles/${deletingVehicle.tmsVehicleId}`);
      toast.success("ลบยานพาหนะสำเร็จ");
      deleteModal.onClose();
      setDeletingVehicle(null);
      reload();
    } catch (error) {
      toast.error(error.message || "ลบยานพาหนะล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/tms/vehicles/${item.tmsVehicleId}`, { isActive: !item.isActive });
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
    <VehiclesView
      vehicles={vehicles}
      loading={loading}
      saving={saving}
      editingVehicle={editingVehicle}
      formData={formData}
      validationErrors={validationErrors}
      deletingVehicle={deletingVehicle}
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
