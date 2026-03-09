"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
} from "@/modules/sales/actions";
import { validateForm, isRequired } from "@/lib/validation";

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

export function useSalesOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getOpportunities();
      setOpportunities(data);
    } catch (error) {
      toast.error("โหลดโอกาสการขายล้มเหลว");
    } finally {
      setLoading(false);
    }
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
      crmOpportunityName: [
        (v) => !isRequired(v) && "กรุณาระบุชื่อโอกาส",
      ],
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
        await updateOpportunity(editingOpp.crmOpportunityId, payload);
        toast.success("อัปเดตโอกาสสำเร็จ");
      } else {
        await createOpportunity(payload);
        toast.success("สร้างโอกาสสำเร็จ");
      }
      onClose();
      loadData();
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
      await updateOpportunity(opp.crmOpportunityId, {
        crmOpportunityStage: newStage,
        crmOpportunityProbability: STAGE_PROBABILITY[newStage] || 10,
      });
      toast.success(`ย้ายไปขั้นตอน ${newStage.replace(/_/g, " ")} สำเร็จ`);
      loadData();
    } catch (error) {
      toast.error(error.message || "อัปเดตขั้นตอนล้มเหลว");
    }
  };

  const handleCloseLost = async () => {
    if (!editingOpp) return;
    try {
      await updateOpportunity(editingOpp.crmOpportunityId, {
        crmOpportunityStage: "closed_lost",
        crmOpportunityProbability: 0,
        crmOpportunityLostReason: lostReason,
      });
      toast.success("ปิดโอกาสเป็นแพ้สำเร็จ");
      lostReasonModal.onClose();
      setEditingOpp(null);
      loadData();
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
      await deleteOpportunity(deletingOpp.crmOpportunityId);
      toast.success("ลบโอกาสสำเร็จ");
      deleteModal.onClose();
      setDeletingOpp(null);
      loadData();
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
      await updateOpportunity(item.crmOpportunityId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadData();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  return {
    opportunities,
    loading,
    saving,
    editingOpp,
    formData,
    validationErrors,
    deletingOpp,
    viewMode,
    setViewMode,
    lostReason,
    setLostReason,
    lostReasonModal,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    handleStageChange,
    handleCloseLost,
    confirmDelete,
    handleDelete,
    toggleActive,
  };
}
