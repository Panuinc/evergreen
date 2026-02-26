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
  tmsMaintenanceVehicleId: "",
  tmsMaintenanceType: "repair",
  tmsMaintenanceDescription: "",
  tmsMaintenanceDate: today,
  tmsMaintenanceCompletedDate: "",
  tmsMaintenanceMileage: "",
  tmsMaintenanceCost: "",
  tmsMaintenanceVendor: "",
  tmsMaintenanceStatus: "scheduled",
  tmsMaintenanceNextDueDate: "",
  tmsMaintenanceNextDueMileage: "",
  tmsMaintenanceNotes: "",
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
      toast.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (maintenance = null) => {
    if (maintenance) {
      setEditingMaintenance(maintenance);
      setFormData({
        tmsMaintenanceVehicleId: maintenance.tmsMaintenanceVehicleId?.toString() || "",
        tmsMaintenanceType: maintenance.tmsMaintenanceType || "repair",
        tmsMaintenanceDescription: maintenance.tmsMaintenanceDescription || "",
        tmsMaintenanceDate: maintenance.tmsMaintenanceDate || today,
        tmsMaintenanceCompletedDate: maintenance.tmsMaintenanceCompletedDate || "",
        tmsMaintenanceMileage: maintenance.tmsMaintenanceMileage?.toString() || "",
        tmsMaintenanceCost: maintenance.tmsMaintenanceCost?.toString() || "",
        tmsMaintenanceVendor: maintenance.tmsMaintenanceVendor || "",
        tmsMaintenanceStatus: maintenance.tmsMaintenanceStatus || "scheduled",
        tmsMaintenanceNextDueDate: maintenance.tmsMaintenanceNextDueDate || "",
        tmsMaintenanceNextDueMileage:
          maintenance.tmsMaintenanceNextDueMileage?.toString() || "",
        tmsMaintenanceNotes: maintenance.tmsMaintenanceNotes || "",
      });
    } else {
      setEditingMaintenance(null);
      setFormData(emptyForm);
    }
    onOpen();
  };

  const handleSave = async () => {
    if (
      !formData.tmsMaintenanceVehicleId ||
      !formData.tmsMaintenanceDescription.trim()
    ) {
      toast.error("กรุณาระบุยานพาหนะและรายละเอียด");
      return;
    }

    const payload = {
      ...formData,
      tmsMaintenanceMileage: formData.tmsMaintenanceMileage
        ? parseFloat(formData.tmsMaintenanceMileage)
        : null,
      tmsMaintenanceCost: formData.tmsMaintenanceCost
        ? parseFloat(formData.tmsMaintenanceCost)
        : null,
      tmsMaintenanceNextDueMileage: formData.tmsMaintenanceNextDueMileage
        ? parseFloat(formData.tmsMaintenanceNextDueMileage)
        : null,
    };

    try {
      setSaving(true);
      if (editingMaintenance) {
        await updateMaintenance(editingMaintenance.tmsMaintenanceId, payload);
        toast.success("อัปเดตบันทึกการบำรุงรักษาสำเร็จ");
      } else {
        await createMaintenance(payload);
        toast.success("สร้างบันทึกการบำรุงรักษาสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกการบำรุงรักษาล้มเหลว");
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
      await deleteMaintenance(deletingMaintenance.tmsMaintenanceId);
      toast.success("ลบบันทึกการบำรุงรักษาสำเร็จ");
      deleteModal.onClose();
      setDeletingMaintenance(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบบันทึกการบำรุงรักษาล้มเหลว");
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
