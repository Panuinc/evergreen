"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
} from "@/actions/sales";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  opportunityName: "",
  opportunityStage: "prospecting",
  opportunityAmount: "",
  opportunityProbability: "10",
  opportunityExpectedCloseDate: "",
  opportunityContactId: "",
  opportunityAccountId: "",
  opportunityAssignedTo: "",
  opportunitySource: "",
  opportunityNotes: "",
};

const STAGE_PROBABILITY = {
  prospecting: 10,
  qualification: 25,
  proposal: 50,
  negotiation: 75,
  closed_won: 100,
  closed_lost: 0,
};

export function useCrmOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingOpp, setEditingOpp] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [viewMode, setViewMode] = useState("table"); // table | kanban
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
      toast.error("Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (opp = null) => {
    if (opp) {
      setEditingOpp(opp);
      setFormData({
        opportunityName: opp.opportunityName || "",
        opportunityStage: opp.opportunityStage || "prospecting",
        opportunityAmount: opp.opportunityAmount?.toString() || "",
        opportunityProbability: opp.opportunityProbability?.toString() || "10",
        opportunityExpectedCloseDate: opp.opportunityExpectedCloseDate || "",
        opportunityContactId: opp.opportunityContactId || "",
        opportunityAccountId: opp.opportunityAccountId || "",
        opportunityAssignedTo: opp.opportunityAssignedTo || "",
        opportunitySource: opp.opportunitySource || "",
        opportunityNotes: opp.opportunityNotes || "",
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
      opportunityName: [
        (v) => !isRequired(v) && "Opportunity name is required",
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
        opportunityAmount: formData.opportunityAmount
          ? parseFloat(formData.opportunityAmount)
          : 0,
        opportunityProbability: parseInt(formData.opportunityProbability) || 10,
      };
      if (!payload.opportunityContactId) delete payload.opportunityContactId;
      if (!payload.opportunityAccountId) delete payload.opportunityAccountId;

      if (editingOpp) {
        await updateOpportunity(editingOpp.opportunityId, payload);
        toast.success("Opportunity updated");
      } else {
        await createOpportunity(payload);
        toast.success("Opportunity created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save opportunity");
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
      await updateOpportunity(opp.opportunityId, {
        opportunityStage: newStage,
        opportunityProbability: STAGE_PROBABILITY[newStage] || 10,
      });
      toast.success(`Moved to ${newStage.replace(/_/g, " ")}`);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to update stage");
    }
  };

  const handleCloseLost = async () => {
    if (!editingOpp) return;
    try {
      await updateOpportunity(editingOpp.opportunityId, {
        opportunityStage: "closed_lost",
        opportunityProbability: 0,
        opportunityLostReason: lostReason,
      });
      toast.success("Opportunity closed as lost");
      lostReasonModal.onClose();
      setEditingOpp(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to close opportunity");
    }
  };

  const confirmDelete = (opp) => {
    setDeletingOpp(opp);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingOpp) return;
    try {
      await deleteOpportunity(deletingOpp.opportunityId);
      toast.success("Opportunity deleted");
      deleteModal.onClose();
      setDeletingOpp(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete opportunity");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-update probability when stage changes
      if (field === "opportunityStage" && STAGE_PROBABILITY[value] !== undefined) {
        updated.opportunityProbability = STAGE_PROBABILITY[value].toString();
      }
      return updated;
    });
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
  };
}
