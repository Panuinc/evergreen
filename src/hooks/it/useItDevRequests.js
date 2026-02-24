"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import {
  getDevRequests,
  createDevRequest,
  updateDevRequest,
  deleteDevRequest,
  getProgressLogs,
  createProgressLog,
} from "@/actions/it";
import { validateForm, isRequired } from "@/lib/validation";

const emptyForm = {
  requestTitle: "",
  requestDescription: "",
  requestedBy: "",
  requestPriority: "medium",
  requestStatus: "pending",
  requestAssignedTo: "",
  requestProgress: "0",
  requestStartDate: "",
  requestDueDate: "",
  requestNotes: "",
};

const emptyProgressForm = {
  logDescription: "",
  logProgress: "",
  logCreatedBy: "",
};

export function useItDevRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingRequest, setDeletingRequest] = useState(null);

  // Progress tracking
  const progressModal = useDisclosure();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [progressLogs, setProgressLogs] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressForm, setProgressForm] = useState(emptyProgressForm);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDevRequests();
      setRequests(data);
    } catch (error) {
      toast.error("โหลดคำขอพัฒนาระบบล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (request = null) => {
    if (request) {
      setEditingRequest(request);
      setFormData({
        requestTitle: request.requestTitle || "",
        requestDescription: request.requestDescription || "",
        requestedBy: request.requestedBy || "",
        requestPriority: request.requestPriority || "medium",
        requestStatus: request.requestStatus || "pending",
        requestAssignedTo: request.requestAssignedTo || "",
        requestProgress: request.requestProgress?.toString() || "0",
        requestStartDate: request.requestStartDate || "",
        requestDueDate: request.requestDueDate || "",
        requestNotes: request.requestNotes || "",
      });
    } else {
      setEditingRequest(null);
      setFormData(emptyForm);
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      requestTitle: [(v) => !isRequired(v) && "กรุณาระบุหัวข้อ"],
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
        requestProgress: parseInt(formData.requestProgress) || 0,
      };
      if (editingRequest) {
        await updateDevRequest(editingRequest.requestId, payload);
        toast.success("อัปเดตคำขอสำเร็จ");
      } else {
        await createDevRequest(payload);
        toast.success("สร้างคำขอสำเร็จ");
      }
      onClose();
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกคำขอล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (request) => {
    setDeletingRequest(request);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingRequest) return;
    try {
      await deleteDevRequest(deletingRequest.requestId);
      toast.success("ลบคำขอสำเร็จ");
      deleteModal.onClose();
      setDeletingRequest(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบคำขอล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Progress modal
  const openProgress = async (request) => {
    setSelectedRequest(request);
    setProgressForm({
      ...emptyProgressForm,
      logProgress: request.requestProgress?.toString() || "0",
    });
    progressModal.onOpen();
    try {
      setProgressLoading(true);
      const logs = await getProgressLogs(request.requestId);
      setProgressLogs(logs);
    } catch {
      toast.error("โหลดบันทึกความคืบหน้าล้มเหลว");
    } finally {
      setProgressLoading(false);
    }
  };

  const handleAddProgress = async () => {
    if (!progressForm.logDescription.trim()) {
      toast.error("กรุณาระบุรายละเอียด");
      return;
    }
    if (!progressForm.logProgress) {
      toast.error("กรุณาระบุเปอร์เซ็นต์ความคืบหน้า");
      return;
    }

    try {
      setProgressSaving(true);
      await createProgressLog(selectedRequest.requestId, {
        logDescription: progressForm.logDescription,
        logProgress: parseInt(progressForm.logProgress) || 0,
        logCreatedBy: progressForm.logCreatedBy,
      });
      toast.success("อัปเดตความคืบหน้าสำเร็จ");

      // Reload logs and request list
      const logs = await getProgressLogs(selectedRequest.requestId);
      setProgressLogs(logs);
      setProgressForm({
        ...emptyProgressForm,
        logProgress: progressForm.logProgress,
      });
      loadData();

      // Update selected request locally
      setSelectedRequest((prev) => ({
        ...prev,
        requestProgress: parseInt(progressForm.logProgress) || 0,
      }));
    } catch (error) {
      toast.error(error.message || "เพิ่มความคืบหน้าล้มเหลว");
    } finally {
      setProgressSaving(false);
    }
  };

  const updateProgressField = (field, value) => {
    setProgressForm((prev) => ({ ...prev, [field]: value }));
  };

  return {
    requests,
    loading,
    saving,
    editingRequest,
    formData,
    validationErrors,
    deletingRequest,
    isOpen,
    onClose,
    deleteModal,
    updateField,
    handleOpen,
    handleSave,
    confirmDelete,
    handleDelete,
    // Progress
    progressModal,
    selectedRequest,
    progressLogs,
    progressLoading,
    progressSaving,
    progressForm,
    openProgress,
    handleAddProgress,
    updateProgressField,
  };
}
