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
} from "@/modules/sales/actions";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  crmLeadName: "",
  crmLeadEmail: "",
  crmLeadPhone: "",
  crmLeadCompany: "",
  crmLeadPosition: "",
  crmLeadSource: "website",
  crmLeadScore: "warm",
  crmLeadStatus: "new",
  crmLeadAssignedTo: "",
  crmLeadNotes: "",
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
      toast.error("โหลดลีดล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        crmLeadName: lead.crmLeadName || "",
        crmLeadEmail: lead.crmLeadEmail || "",
        crmLeadPhone: lead.crmLeadPhone || "",
        crmLeadCompany: lead.crmLeadCompany || "",
        crmLeadPosition: lead.crmLeadPosition || "",
        crmLeadSource: lead.crmLeadSource || "website",
        crmLeadScore: lead.crmLeadScore || "warm",
        crmLeadStatus: lead.crmLeadStatus || "new",
        crmLeadAssignedTo: lead.crmLeadAssignedTo || "",
        crmLeadNotes: lead.crmLeadNotes || "",
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
      crmLeadName: [(v) => !isRequired(v) && "กรุณาระบุชื่อลีด"],
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
        await updateLead(editingLead.crmLeadId, formData);
        toast.success("อัปเดตลีดสำเร็จ");
      } else {
        await createLead(formData);
        toast.success("สร้างลีดสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกลีดล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async (lead) => {
    try {
      setSaving(true);
      const result = await convertLead(lead.crmLeadId);
      toast.success("แปลงลีดเป็นโอกาสและผู้ติดต่อสำเร็จ");
      loadData();
      return result;
    } catch (error) {
      toast.error(error.message || "แปลงลีดล้มเหลว");
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
      await deleteLead(deletingLead.crmLeadId);
      toast.success("ลบลีดสำเร็จ");
      deleteModal.onClose();
      setDeletingLead(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบลีดล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleActive = async (item) => {
    try {
      await updateLead(item.crmLeadId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadData();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
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
    toggleActive,
  };
}
