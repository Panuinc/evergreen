"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { getActivities, createActivity, updateActivity, deleteActivity } from "@/modules/sales/actions";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  crmActivityType: "task",
  crmActivitySubject: "",
  crmActivityDescription: "",
  crmActivityStatus: "pending",
  crmActivityPriority: "medium",
  crmActivityDueDate: "",
  crmActivityContactId: "",
  crmActivityOpportunityId: "",
  crmActivityAccountId: "",
  crmActivityAssignedTo: "",
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
      toast.error("โหลดกิจกรรมล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (activity = null) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        crmActivityType: activity.crmActivityType || "task",
        crmActivitySubject: activity.crmActivitySubject || "",
        crmActivityDescription: activity.crmActivityDescription || "",
        crmActivityStatus: activity.crmActivityStatus || "pending",
        crmActivityPriority: activity.crmActivityPriority || "medium",
        crmActivityDueDate: activity.crmActivityDueDate
          ? new Date(activity.crmActivityDueDate).toISOString().slice(0, 16)
          : "",
        crmActivityContactId: activity.crmActivityContactId || "",
        crmActivityOpportunityId: activity.crmActivityOpportunityId || "",
        crmActivityAccountId: activity.crmActivityAccountId || "",
        crmActivityAssignedTo: activity.crmActivityAssignedTo || "",
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
      crmActivitySubject: [(v) => !isRequired(v) && "กรุณาระบุหัวข้อ"],
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
      if (!payload.crmActivityContactId) delete payload.crmActivityContactId;
      if (!payload.crmActivityOpportunityId) delete payload.crmActivityOpportunityId;
      if (!payload.crmActivityAccountId) delete payload.crmActivityAccountId;
      if (!payload.crmActivityDueDate) delete payload.crmActivityDueDate;

      if (payload.crmActivityStatus === "completed" && !payload.crmActivityCompletedAt) {
        payload.crmActivityCompletedAt = new Date().toISOString();
      }

      if (editingActivity) {
        await updateActivity(editingActivity.crmActivityId, payload);
        toast.success("อัปเดตกิจกรรมสำเร็จ");
      } else {
        await createActivity(payload);
        toast.success("สร้างกิจกรรมสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกกิจกรรมล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (activity) => {
    try {
      const newStatus =
        activity.crmActivityStatus === "completed" ? "pending" : "completed";
      await updateActivity(activity.crmActivityId, {
        crmActivityStatus: newStatus,
        crmActivityCompletedAt:
          newStatus === "completed" ? new Date().toISOString() : null,
      });
      toast.success(
        newStatus === "completed" ? "เสร็จสิ้นกิจกรรมแล้ว" : "เปิดกิจกรรมอีกครั้ง"
      );
      loadData();
    } catch (error) {
      toast.error(error.message || "อัปเดตกิจกรรมล้มเหลว");
    }
  };

  const confirmDelete = (activity) => {
    setDeletingActivity(activity);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingActivity) return;
    try {
      await deleteActivity(deletingActivity.crmActivityId);
      toast.success("ลบกิจกรรมสำเร็จ");
      deleteModal.onClose();
      setDeletingActivity(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบกิจกรรมล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleActive = async (item) => {
    try {
      await updateActivity(item.crmActivityId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadData();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
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
    toggleActive,
  };
}
