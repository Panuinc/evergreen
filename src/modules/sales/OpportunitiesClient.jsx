"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import OpportunitiesView from "@/modules/sales/components/OpportunitiesView";

const emptyForm = {
  crmOpportunityName: "",
  crmOpportunityStage: "prospecting",
  crmOpportunityAmount: "",
  crmOpportunityProbability: "10",
  crmOpportunityExpectedCloseDate: "",
  crmOpportunityContactId: "",
  crmOpportunityAccountId: "",
  crmOpportunityAssignedTo: "",
  crmOpportunitySource: "",
  crmOpportunityNotes: "",
};

const STAGE_PROBABILITY = {
  prospecting: 10,
  qualification: 25,
  proposal: 50,
  negotiation: 75,
  closed_won: 100,
  closed_lost: 0,
};

export default function OpportunitiesClient({ initialOpportunities }) {
  const [opportunities, setOpportunities] = useState(initialOpportunities);
  const [saving, setSaving] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [viewMode, setViewMode] = useState("table");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingOpp, setDeletingOpp] = useState(null);
  const lostReasonModal = useDisclosure();
  const [lostReason, setLostReason] = useState("");

  const reloadOpportunities = async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get("/api/sales/opportunities");
      setOpportunities(data);
    } catch {}
  };

  const handleOpen = (opp = null) => {
    if (opp) {
      setEditingOpp(opp);
      setFormData({
        crmOpportunityName: opp.crmOpportunityName || "",
        crmOpportunityStage: opp.crmOpportunityStage || "prospecting",
        crmOpportunityAmount: opp.crmOpportunityAmount?.toString() || "",
        crmOpportunityProbability: opp.crmOpportunityProbability?.toString() || "10",
        crmOpportunityExpectedCloseDate: opp.crmOpportunityExpectedCloseDate || "",
        crmOpportunityContactId: opp.crmOpportunityContactId || "",
        crmOpportunityAccountId: opp.crmOpportunityAccountId || "",
        crmOpportunityAssignedTo: opp.crmOpportunityAssignedTo || "",
        crmOpportunitySource: opp.crmOpportunitySource || "",
        crmOpportunityNotes: opp.crmOpportunityNotes || "",
      });
    } else {
      setEditingOpp(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      crmOpportunityName: [(v) => !isRequired(v) && "กรุณาระบุชื่อโอกาส"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      const payload = {
        ...formData,
        crmOpportunityAmount: formData.crmOpportunityAmount
          ? parseFloat(formData.crmOpportunityAmount)
          : 0,
        crmOpportunityProbability: parseInt(formData.crmOpportunityProbability) || 10,
      };
      if (!payload.crmOpportunityContactId) delete payload.crmOpportunityContactId;
      if (!payload.crmOpportunityAccountId) delete payload.crmOpportunityAccountId;

      if (editingOpp) {
        await put(`/api/sales/opportunities/${editingOpp.crmOpportunityId}`, payload);
        toast.success("อัปเดตโอกาสสำเร็จ");
      } else {
        await post("/api/sales/opportunities", payload);
        toast.success("สร้างโอกาสสำเร็จ");
      }
      onClose();
      reloadOpportunities();
    } catch (error) {
      toast.error(error.message || "บันทึกโอกาสล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (opp, newStage) => {
    if (newStage === "closed_lost") {
      setEditingOpp(opp);
      setLostReason("");
      lostReasonModal.onOpen();
      return;
    }

    try {
      await put(`/api/sales/opportunities/${opp.crmOpportunityId}`, {
        crmOpportunityStage: newStage,
        crmOpportunityProbability: STAGE_PROBABILITY[newStage] || 10,
      });
      toast.success(`ย้ายไปขั้นตอน ${newStage.replace(/_/g, " ")} สำเร็จ`);
      reloadOpportunities();
    } catch (error) {
      toast.error(error.message || "อัปเดตขั้นตอนล้มเหลว");
    }
  };

  const handleCloseLost = async () => {
    if (!editingOpp) return;
    try {
      await put(`/api/sales/opportunities/${editingOpp.crmOpportunityId}`, {
        crmOpportunityStage: "closed_lost",
        crmOpportunityProbability: 0,
        crmOpportunityLostReason: lostReason,
      });
      toast.success("ปิดโอกาสเป็นแพ้สำเร็จ");
      lostReasonModal.onClose();
      setEditingOpp(null);
      reloadOpportunities();
    } catch (error) {
      toast.error(error.message || "ปิดโอกาสล้มเหลว");
    }
  };

  const confirmDelete = (opp) => {
    setDeletingOpp(opp);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingOpp) return;
    try {
      await del(`/api/sales/opportunities/${deletingOpp.crmOpportunityId}`);
      toast.success("ลบโอกาสสำเร็จ");
      deleteModal.onClose();
      setDeletingOpp(null);
      reloadOpportunities();
    } catch (error) {
      toast.error(error.message || "ลบโอกาสล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "crmOpportunityStage" && STAGE_PROBABILITY[value] !== undefined) {
        updated.crmOpportunityProbability = STAGE_PROBABILITY[value].toString();
      }
      return updated;
    });
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/sales/opportunities/${item.crmOpportunityId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadOpportunities();
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  return (
    <OpportunitiesView
      opportunities={opportunities}
      loading={false}
      saving={saving}
      editingOpp={editingOpp}
      formData={formData}
      validationErrors={validationErrors}
      deletingOpp={deletingOpp}
      viewMode={viewMode}
      setViewMode={setViewMode}
      lostReason={lostReason}
      setLostReason={setLostReason}
      lostReasonModal={lostReasonModal}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      handleStageChange={handleStageChange}
      handleCloseLost={handleCloseLost}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      toggleActive={toggleActive}
    />
  );
}
