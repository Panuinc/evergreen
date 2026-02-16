"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getMaintenances,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
  getVehicles,
} from "@/actions/tms";

const today = new Date().toISOString().split("T")[0];

const emptyForm = {
  maintenanceVehicleId: "",
  maintenanceType: "repair",
  maintenanceDescription: "",
  maintenanceDate: today,
  maintenanceCompletedDate: "",
  maintenanceMileage: "",
  maintenanceCost: "",
  maintenanceVendor: "",
  maintenanceStatus: "scheduled",
  maintenanceNextDueDate: "",
  maintenanceNextDueMileage: "",
  maintenanceNotes: "",
};

export function useMaintenance() {
  const [maintenances, setMaintenances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingMaintenance, setDeletingMaintenance] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [maintData, vehData] = await Promise.all([
        getMaintenances(),
        getVehicles(),
      ]);
      setMaintenances(maintData);
      setVehicles(vehData);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (maintenance = null) => {
    if (maintenance) {
      setEditingMaintenance(maintenance);
      setFormData({
        maintenanceVehicleId: maintenance.maintenanceVehicleId?.toString() || "",
        maintenanceType: maintenance.maintenanceType || "repair",
        maintenanceDescription: maintenance.maintenanceDescription || "",
        maintenanceDate: maintenance.maintenanceDate || today,
        maintenanceCompletedDate: maintenance.maintenanceCompletedDate || "",
        maintenanceMileage: maintenance.maintenanceMileage?.toString() || "",
        maintenanceCost: maintenance.maintenanceCost?.toString() || "",
        maintenanceVendor: maintenance.maintenanceVendor || "",
        maintenanceStatus: maintenance.maintenanceStatus || "scheduled",
        maintenanceNextDueDate: maintenance.maintenanceNextDueDate || "",
        maintenanceNextDueMileage:
          maintenance.maintenanceNextDueMileage?.toString() || "",
        maintenanceNotes: maintenance.maintenanceNotes || "",
      });
    } else {
      setEditingMaintenance(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.maintenanceVehicleId ||
      !formData.maintenanceDescription.trim()
    ) {
      toast.error("Vehicle and description are required");
      return;
    }

    const payload = {
      ...formData,
      maintenanceMileage: formData.maintenanceMileage
        ? parseFloat(formData.maintenanceMileage)
        : null,
      maintenanceCost: formData.maintenanceCost
        ? parseFloat(formData.maintenanceCost)
        : null,
      maintenanceNextDueMileage: formData.maintenanceNextDueMileage
        ? parseFloat(formData.maintenanceNextDueMileage)
        : null,
    };

    try {
      setSaving(true);
      if (editingMaintenance) {
        await updateMaintenance(editingMaintenance.maintenanceId, payload);
        toast.success("Maintenance record updated");
      } else {
        await createMaintenance(payload);
        toast.success("Maintenance record created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save maintenance record");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (maintenance) => {
    setDeletingMaintenance(maintenance);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingMaintenance) return;
    try {
      await deleteMaintenance(deletingMaintenance.maintenanceId);
      toast.success("Maintenance record deleted");
      deleteModal.onClose();
      setDeletingMaintenance(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete maintenance record");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    maintenances,
    vehicles,
    loading,
    saving,
    editingMaintenance,
    formData,
    deletingMaintenance,
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
