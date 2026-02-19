"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
} from "@/actions/sales";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  leadName: "",
  leadEmail: "",
  leadPhone: "",
  leadCompany: "",
  leadPosition: "",
  leadSource: "website",
  leadScore: "warm",
  leadStatus: "new",
  leadAssignedTo: "",
  leadNotes: "",
};

export function useCrmLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingLead, setDeletingLead] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getLeads();
      setLeads(data);
    } catch (error) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        leadName: lead.leadName || "",
        leadEmail: lead.leadEmail || "",
        leadPhone: lead.leadPhone || "",
        leadCompany: lead.leadCompany || "",
        leadPosition: lead.leadPosition || "",
        leadSource: lead.leadSource || "website",
        leadScore: lead.leadScore || "warm",
        leadStatus: lead.leadStatus || "new",
        leadAssignedTo: lead.leadAssignedTo || "",
        leadNotes: lead.leadNotes || "",
      });
    } else {
      setEditingLead(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      leadName: [(v) => !isRequired(v) && "Lead name is required"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      if (editingLead) {
        await updateLead(editingLead.leadId, formData);
        toast.success("Lead updated");
      } else {
        await createLead(formData);
        toast.success("Lead created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save lead");
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async (lead) => {
    try {
      setSaving(true);
      const result = await convertLead(lead.leadId);
      toast.success("Lead converted to opportunity & contact");
      loadData();
      return result;
    } catch (error) {
      toast.error(error.message || "Failed to convert lead");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (lead) => {
    setDeletingLead(lead);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingLead) return;
    try {
      await deleteLead(deletingLead.leadId);
      toast.success("Lead deleted");
      deleteModal.onClose();
      setDeletingLead(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete lead");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    leads,
    loading,
    saving,
    editingLead,
    formData,
    validationErrors,
    deletingLead,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    handleConvert,
    confirmDelete,
    handleDelete,
  };
}
