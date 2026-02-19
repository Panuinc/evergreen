"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { getActivities, createActivity, updateActivity, deleteActivity } from "@/actions/sales";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  activityType: "task",
  activitySubject: "",
  activityDescription: "",
  activityStatus: "pending",
  activityPriority: "medium",
  activityDueDate: "",
  activityContactId: "",
  activityOpportunityId: "",
  activityAccountId: "",
  activityAssignedTo: "",
};

export function useCrmActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingActivity, setDeletingActivity] = useState(null);

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await getActivities(Object.keys(params).length ? params : undefined);
      setActivities(data);
    } catch (error) {
      toast.error("Failed to load activities");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (activity = null) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        activityType: activity.activityType || "task",
        activitySubject: activity.activitySubject || "",
        activityDescription: activity.activityDescription || "",
        activityStatus: activity.activityStatus || "pending",
        activityPriority: activity.activityPriority || "medium",
        activityDueDate: activity.activityDueDate
          ? new Date(activity.activityDueDate).toISOString().slice(0, 16)
          : "",
        activityContactId: activity.activityContactId || "",
        activityOpportunityId: activity.activityOpportunityId || "",
        activityAccountId: activity.activityAccountId || "",
        activityAssignedTo: activity.activityAssignedTo || "",
      });
    } else {
      setEditingActivity(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      activitySubject: [(v) => !isRequired(v) && "Subject is required"],
    });
    if (!isValid) {
      setValidationErrors(errors);
      Object.values(errors).forEach((msg) => toast.error(msg));
      return;
    }
    setValidationErrors({});

    try {
      setSaving(true);
      const payload = { ...formData };
      if (!payload.activityContactId) delete payload.activityContactId;
      if (!payload.activityOpportunityId) delete payload.activityOpportunityId;
      if (!payload.activityAccountId) delete payload.activityAccountId;
      if (!payload.activityDueDate) delete payload.activityDueDate;

      if (payload.activityStatus === "completed" && !payload.activityCompletedAt) {
        payload.activityCompletedAt = new Date().toISOString();
      }

      if (editingActivity) {
        await updateActivity(editingActivity.activityId, payload);
        toast.success("Activity updated");
      } else {
        await createActivity(payload);
        toast.success("Activity created");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save activity");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (activity) => {
    try {
      const newStatus =
        activity.activityStatus === "completed" ? "pending" : "completed";
      await updateActivity(activity.activityId, {
        activityStatus: newStatus,
        activityCompletedAt:
          newStatus === "completed" ? new Date().toISOString() : null,
      });
      toast.success(
        newStatus === "completed" ? "Activity completed" : "Activity reopened"
      );
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to update activity");
    }
  };

  const confirmDelete = (activity) => {
    setDeletingActivity(activity);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingActivity) return;
    try {
      await deleteActivity(deletingActivity.activityId);
      toast.success("Activity deleted");
      deleteModal.onClose();
      setDeletingActivity(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete activity");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return {
    activities,
    loading,
    saving,
    editingActivity,
    formData,
    validationErrors,
    deletingActivity,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    handleToggleComplete,
    confirmDelete,
    handleDelete,
  };
}
