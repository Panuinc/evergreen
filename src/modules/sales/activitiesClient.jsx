"use client";

import { useState, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import ActivitiesView from "@/modules/sales/components/activitiesView";

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

export default function ActivitiesClient({ initialActivities }) {
  const [activities, setActivities] = useState(initialActivities);
  const [saving, setSaving] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingActivity, setDeletingActivity] = useState(null);

  const reloadActivities = useCallback(async (tFilter, sFilter) => {
    try {
      const { get } = await import("@/lib/apiClient");
      const params = {};
      if (tFilter) params.type = tFilter;
      if (sFilter) params.status = sFilter;
      const query = Object.keys(params).length
        ? `?${new URLSearchParams(params).toString()}`
        : "";
      const data = await get(`/api/sales/activities${query}`);
      setActivities(data);
    } catch {}
  }, []);

  const handleTypeFilterChange = useCallback((val) => {
    setTypeFilter(val);
    reloadActivities(val, statusFilter);
  }, [statusFilter, reloadActivities]);

  const handleStatusFilterChange = useCallback((val) => {
    setStatusFilter(val);
    reloadActivities(typeFilter, val);
  }, [typeFilter, reloadActivities]);

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
        await put(`/api/sales/activities/${editingActivity.crmActivityId}`, payload);
        toast.success("อัปเดตกิจกรรมสำเร็จ");
      } else {
        await post("/api/sales/activities", payload);
        toast.success("สร้างกิจกรรมสำเร็จ");
      }
      onClose();
      reloadActivities(typeFilter, statusFilter);
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
      await put(`/api/sales/activities/${activity.crmActivityId}`, {
        crmActivityStatus: newStatus,
        crmActivityCompletedAt:
          newStatus === "completed" ? new Date().toISOString() : null,
      });
      toast.success(
        newStatus === "completed" ? "เสร็จสิ้นกิจกรรมแล้ว" : "เปิดกิจกรรมอีกครั้ง"
      );
      reloadActivities(typeFilter, statusFilter);
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
      await del(`/api/sales/activities/${deletingActivity.crmActivityId}`);
      toast.success("ลบกิจกรรมสำเร็จ");
      deleteModal.onClose();
      setDeletingActivity(null);
      reloadActivities(typeFilter, statusFilter);
    } catch (error) {
      toast.error(error.message || "ลบกิจกรรมล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/sales/activities/${item.crmActivityId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadActivities(typeFilter, statusFilter);
    } catch {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <ActivitiesView
      activities={activities}
      loading={false}
      saving={saving}
      editingActivity={editingActivity}
      formData={formData}
      validationErrors={validationErrors}
      deletingActivity={deletingActivity}
      typeFilter={typeFilter}
      setTypeFilter={handleTypeFilterChange}
      statusFilter={statusFilter}
      setStatusFilter={handleStatusFilterChange}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      handleToggleComplete={handleToggleComplete}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      toggleActive={toggleActive}
    />
  );
}
