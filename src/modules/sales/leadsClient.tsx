"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import LeadsView from "@/modules/sales/components/leadsView";

const emptyForm = {
  salesLeadName: "",
  salesLeadEmail: "",
  salesLeadPhone: "",
  salesLeadCompany: "",
  salesLeadPosition: "",
  salesLeadSource: "website",
  salesLeadScore: "warm",
  salesLeadStatus: "new",
  salesLeadAssignedTo: "",
  salesLeadNotes: "",
};

export default function LeadsClient({ initialLeads }) {
  const [leads, setLeads] = useState(initialLeads);
  const [saving, setSaving] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingLead, setDeletingLead] = useState(null);

  const reloadLeads = async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get("/api/sales/leads");
      setLeads(data);
    } catch {}
  };

  const handleOpen = (lead = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        salesLeadName: lead.salesLeadName || "",
        salesLeadEmail: lead.salesLeadEmail || "",
        salesLeadPhone: lead.salesLeadPhone || "",
        salesLeadCompany: lead.salesLeadCompany || "",
        salesLeadPosition: lead.salesLeadPosition || "",
        salesLeadSource: lead.salesLeadSource || "website",
        salesLeadScore: lead.salesLeadScore || "warm",
        salesLeadStatus: lead.salesLeadStatus || "new",
        salesLeadAssignedTo: lead.salesLeadAssignedTo || "",
        salesLeadNotes: lead.salesLeadNotes || "",
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
      salesLeadName: [(v) => !isRequired(v) && "กรุณาระบุชื่อลีด"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg as string));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      if (editingLead) {
        await put(`/api/sales/leads/${editingLead.salesLeadId}`, formData);
        toast.success("อัปเดตลีดสำเร็จ");
      } else {
        await post("/api/sales/leads", formData);
        toast.success("สร้างลีดสำเร็จ");
      }
      onClose();
      reloadLeads();
    } catch (error) {
      toast.error(error.message || "บันทึกลีดล้มเหลว");
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
      await del(`/api/sales/leads/${deletingLead.salesLeadId}`);
      toast.success("ลบลีดสำเร็จ");
      deleteModal.onClose();
      setDeletingLead(null);
      reloadLeads();
    } catch (error) {
      toast.error(error.message || "ลบลีดล้มเหลว");
    }
  };

  const handleConvert = async (lead) => {
    try {
      await post(`/api/sales/leads/${lead.salesLeadId}`, { action: "convert" });
      toast.success("แปลงลีดเป็นลูกค้าสำเร็จ");
      reloadLeads();
    } catch (error) {
      toast.error(error.message || "แปลงลีดล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/sales/leads/${item.salesLeadId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadLeads();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <LeadsView
      leads={leads}
      loading={false}
      saving={saving}
      editingLead={editingLead}
      formData={formData}
      validationErrors={validationErrors}
      deletingLead={deletingLead}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      handleConvert={handleConvert}
      toggleActive={toggleActive}
    />
  );
}
