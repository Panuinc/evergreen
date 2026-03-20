"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import OpportunitiesView from "@/modules/sales/components/opportunitiesView";

const emptyForm = {
  salesOpportunityName: "",
  salesOpportunityStage: "prospecting",
  salesOpportunityAmount: "",
  salesOpportunityProbability: "10",
  salesOpportunityExpectedCloseDate: "",
  salesOpportunityContactId: "",
  salesOpportunityAccountId: "",
  salesOpportunityAssignedTo: "",
  salesOpportunitySource: "",
  salesOpportunityNotes: "",
};

const stageProbability = {
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
        salesOpportunityName: opp.salesOpportunityName || "",
        salesOpportunityStage: opp.salesOpportunityStage || "prospecting",
        salesOpportunityAmount: opp.salesOpportunityAmount?.toString() || "",
        salesOpportunityProbability: opp.salesOpportunityProbability?.toString() || "10",
        salesOpportunityExpectedCloseDate: opp.salesOpportunityExpectedCloseDate || "",
        salesOpportunityContactId: opp.salesOpportunityContactId || "",
        salesOpportunityAccountId: opp.salesOpportunityAccountId || "",
        salesOpportunityAssignedTo: opp.salesOpportunityAssignedTo || "",
        salesOpportunitySource: opp.salesOpportunitySource || "",
        salesOpportunityNotes: opp.salesOpportunityNotes || "",
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
      salesOpportunityName: [(v) => !isRequired(v) && "กรุณาระบุชื่อโอกาส"],
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
        salesOpportunityAmount: formData.salesOpportunityAmount
          ? parseFloat(formData.salesOpportunityAmount)
          : 0,
        salesOpportunityProbability: parseInt(formData.salesOpportunityProbability) || 10,
      };
      if (!payload.salesOpportunityContactId) delete payload.salesOpportunityContactId;
      if (!payload.salesOpportunityAccountId) delete payload.salesOpportunityAccountId;

      if (editingOpp) {
        await put(`/api/sales/opportunities/${editingOpp.salesOpportunityId}`, payload);
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
      await put(`/api/sales/opportunities/${opp.salesOpportunityId}`, {
        salesOpportunityStage: newStage,
        salesOpportunityProbability: stageProbability[newStage] || 10,
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
      await put(`/api/sales/opportunities/${editingOpp.salesOpportunityId}`, {
        salesOpportunityStage: "closed_lost",
        salesOpportunityProbability: 0,
        salesOpportunityLostReason: lostReason,
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
      await del(`/api/sales/opportunities/${deletingOpp.salesOpportunityId}`);
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
      if (field === "salesOpportunityStage" && stageProbability[value] !== undefined) {
        updated.salesOpportunityProbability = stageProbability[value].toString();
      }
      return updated;
    });
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/sales/opportunities/${item.salesOpportunityId}`, { isActive: !item.isActive });
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
