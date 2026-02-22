"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from "@/actions/tms";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  vehiclePlateNumber: "",
  vehicleName: "",
  vehicleType: "truck",
  vehicleBrand: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleColor: "",
  vehicleVinNumber: "",
  vehicleRegistrationExpiry: "",
  vehicleInsuranceExpiry: "",
  vehicleInsurancePolicy: "",
  vehicleActExpiry: "",
  vehicleCapacityKg: "",
  vehicleFuelType: "diesel",
  vehicleCurrentMileage: "",
  vehicleStatus: "available",
  vehicleNotes: "",
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
        vehiclePlateNumber: vehicle.vehiclePlateNumber || "",
        vehicleName: vehicle.vehicleName || "",
        vehicleType: vehicle.vehicleType || "truck",
        vehicleBrand: vehicle.vehicleBrand || "",
        vehicleModel: vehicle.vehicleModel || "",
        vehicleYear: vehicle.vehicleYear?.toString() || "",
        vehicleColor: vehicle.vehicleColor || "",
        vehicleVinNumber: vehicle.vehicleVinNumber || "",
        vehicleRegistrationExpiry: vehicle.vehicleRegistrationExpiry || "",
        vehicleInsuranceExpiry: vehicle.vehicleInsuranceExpiry || "",
        vehicleInsurancePolicy: vehicle.vehicleInsurancePolicy || "",
        vehicleActExpiry: vehicle.vehicleActExpiry || "",
        vehicleCapacityKg: vehicle.vehicleCapacityKg?.toString() || "",
        vehicleFuelType: vehicle.vehicleFuelType || "diesel",
        vehicleCurrentMileage: vehicle.vehicleCurrentMileage?.toString() || "",
        vehicleStatus: vehicle.vehicleStatus || "available",
        vehicleNotes: vehicle.vehicleNotes || "",
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
      vehiclePlateNumber: [(v) => !isRequired(v) && "กรุณาระบุหมายเลขทะเบียน"],
      vehicleName: [(v) => !isRequired(v) && "กรุณาระบุชื่อยานพาหนะ"],
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
        await updateVehicle(editingVehicle.vehicleId, formData);
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
      await deleteVehicle(deletingVehicle.vehicleId);
      toast.success("ลบยานพาหนะสำเร็จ");
      deleteModal.onClose();
      setDeletingVehicle(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบยานพาหนะล้มเหลว");
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
  };
}
