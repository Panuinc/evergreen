"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import LeadsView from "@/modules/sales/components/leadsView";
import type { SalesLead, LeadsClientProps } from "@/modules/sales/types";

const emptyForm: Partial<SalesLead> = {
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

export default function LeadsClient({ initialLeads }: LeadsClientProps) {
  const [leads, setLeads] = useState<SalesLead[]>(initialLeads);
  const [saving, setSaving] = useState(false);
  const [editingLead, setEditingLead] = useState<SalesLead | null>(null);
  const [formData, setFormData] = useState<Partial<SalesLead>>(emptyForm);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingLead, setDeletingLead] = useState<SalesLead | null>(null);

  const reloadLeads = async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get<SalesLead[]>("/api/sales/leads");
      setLeads(data);
    } catch {}
  };

  const handleOpen = (lead: SalesLead | null = null) => {
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
      salesLeadName: [(v: string) => !isRequired(v) && "กรุณาระบุชื่อลีด"],
    });
    if (!isValid) {
      setValidationErrors(errors as Record<string, string>);
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
      toast.error((error as Error).message || "บันทึกลีดล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (lead: SalesLead) => {
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
      toast.error((error as Error).message || "ลบลีดล้มเหลว");
    }
  };

  const handleConvert = async (lead: SalesLead) => {
    try {
      await post(`/api/sales/leads/${lead.salesLeadId}`, { action: "convert" });
      toast.success("แปลงลีดเป็นลูกค้าสำเร็จ");
      reloadLeads();
    } catch (error) {
      toast.error((error as Error).message || "แปลงลีดล้มเหลว");
    }
  };

  const toggleActive = async (item: SalesLead) => {
    try {
      await put(`/api/sales/leads/${item.salesLeadId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadLeads();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const updateField = (field: string, value: string) => {
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
