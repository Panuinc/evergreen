"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getSecurityIncidents,
  createSecurityIncident,
  updateSecurityIncident,
  deleteSecurityIncident,
} from "@/actions/it";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  incidentTitle: "",
  incidentType: "other",
  incidentSeverity: "medium",
  incidentStatus: "open",
  incidentReportedBy: "",
  incidentAssignedTo: "",
  incidentDescription: "",
  incidentResolution: "",
};

export function useItSecurity() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIncident, setEditingIncident] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingIncident, setDeletingIncident] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getSecurityIncidents();
      setIncidents(data);
    } catch (error) {
      toast.error("โหลดเหตุการณ์ด้านความปลอดภัยล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (incident = null) => {
    if (incident) {
      setEditingIncident(incident);
      setFormData({
        incidentTitle: incident.incidentTitle || "",
        incidentType: incident.incidentType || "other",
        incidentSeverity: incident.incidentSeverity || "medium",
        incidentStatus: incident.incidentStatus || "open",
        incidentReportedBy: incident.incidentReportedBy || "",
        incidentAssignedTo: incident.incidentAssignedTo || "",
        incidentDescription: incident.incidentDescription || "",
        incidentResolution: incident.incidentResolution || "",
      });
    } else {
      setEditingIncident(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      incidentTitle: [(v) => !isRequired(v) && "กรุณาระบุหัวข้อเหตุการณ์"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      if (editingIncident) {
        await updateSecurityIncident(editingIncident.incidentId, formData);
        toast.success("อัปเดตเหตุการณ์สำเร็จ");
      } else {
        await createSecurityIncident(formData);
        toast.success("สร้างเหตุการณ์สำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกเหตุการณ์ล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (incident) => {
    setDeletingIncident(incident);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingIncident) return;
    try {
      await deleteSecurityIncident(deletingIncident.incidentId);
      toast.success("ลบเหตุการณ์สำเร็จ");
      deleteModal.onClose();
      setDeletingIncident(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบเหตุการณ์ล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    incidents,
    loading,
    saving,
    editingIncident,
    formData,
    validationErrors,
    deletingIncident,
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
