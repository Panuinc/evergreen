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
} from "@/modules/it/actions";
import { getEmployees } from "@/modules/hr/actions";
import { validateForm, isRequired } from "@/lib/validation";
import { useAuth } from "@/contexts/AuthContext";

const emptyForm = {
  itDevRequestTitle: "",
  itDevRequestDescription: "",
  itDevRequestRequestedBy: "",
  itDevRequestPriority: "medium",
  itDevRequestStatus: "pending",
  itDevRequestAssignedTo: "",
  itDevRequestProgress: "0",
  itDevRequestStartDate: "",
  itDevRequestDueDate: "",
  itDevRequestNotes: "",
};

const emptyProgressForm = {
  itDevProgressLogDescription: "",
  itDevProgressLogProgress: "",
  itDevProgressLogCreatedBy: "",
};

export function useItDevRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingRequest, setDeletingRequest] = useState(null);


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
      const [data, emps] = await Promise.all([getDevRequests(), getEmployees().catch(() => [])]);
      setRequests(data);
      setEmployees(emps);
      if (user?.id) {
        const myEmp = emps.find((e) => e.hrEmployeeUserId === user.id);
        if (myEmp) setCurrentEmployeeName(`${myEmp.hrEmployeeFirstName} ${myEmp.hrEmployeeLastName}`);
      }
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
        itDevRequestTitle: request.itDevRequestTitle || "",
        itDevRequestDescription: request.itDevRequestDescription || "",
        itDevRequestRequestedBy: request.itDevRequestRequestedBy || currentEmployeeName,
        itDevRequestPriority: request.itDevRequestPriority || "medium",
        itDevRequestStatus: request.itDevRequestStatus || "pending",
        itDevRequestAssignedTo: request.itDevRequestAssignedTo || "",
        itDevRequestProgress: request.itDevRequestProgress?.toString() || "0",
        itDevRequestStartDate: request.itDevRequestStartDate || "",
        itDevRequestDueDate: request.itDevRequestDueDate || "",
        itDevRequestNotes: request.itDevRequestNotes || "",
      });
    } else {
      setEditingRequest(null);
      setFormData({ ...emptyForm, itDevRequestRequestedBy: currentEmployeeName });
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      itDevRequestTitle: [(v) => !isRequired(v) && "กรุณาระบุหัวข้อ"],
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
        itDevRequestProgress: parseInt(formData.itDevRequestProgress) || 0,
      };
      if (editingRequest) {
        await updateDevRequest(editingRequest.itDevRequestId, payload);
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
      await deleteDevRequest(deletingRequest.itDevRequestId);
      toast.success("ลบคำขอสำเร็จ");
      deleteModal.onClose();
      setDeletingRequest(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบคำขอล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateDevRequest(item.itDevRequestId, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadData();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  const openProgress = async (request) => {
    setSelectedRequest(request);
    setProgressForm({
      ...emptyProgressForm,
      itDevProgressLogProgress: request.itDevRequestProgress?.toString() || "0",
    });
    progressModal.onOpen();
    try {
      setProgressLoading(true);
      const logs = await getProgressLogs(request.itDevRequestId);
      setProgressLogs(logs);
    } catch {
      toast.error("โหลดบันทึกความคืบหน้าล้มเหลว");
    } finally {
      setProgressLoading(false);
    }
  };

  const handleAddProgress = async () => {
    if (!progressForm.itDevProgressLogDescription.trim()) {
      toast.error("กรุณาระบุรายละเอียด");
      return;
    }
    if (!progressForm.itDevProgressLogProgress) {
      toast.error("กรุณาระบุเปอร์เซ็นต์ความคืบหน้า");
      return;
    }

    try {
      setProgressSaving(true);
      await createProgressLog(selectedRequest.itDevRequestId, {
        itDevProgressLogDescription: progressForm.itDevProgressLogDescription,
        itDevProgressLogProgress: parseInt(progressForm.itDevProgressLogProgress) || 0,
        itDevProgressLogCreatedBy: progressForm.itDevProgressLogCreatedBy,
      });
      toast.success("อัปเดตความคืบหน้าสำเร็จ");


      const logs = await getProgressLogs(selectedRequest.itDevRequestId);
      setProgressLogs(logs);
      setProgressForm({
        ...emptyProgressForm,
        itDevProgressLogProgress: progressForm.itDevProgressLogProgress,
      });
      loadData();


      setSelectedRequest((prev) => ({
        ...prev,
        itDevRequestProgress: parseInt(progressForm.itDevProgressLogProgress) || 0,
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
    employees,
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

    progressModal,
    selectedRequest,
    progressLogs,
    progressLoading,
    progressSaving,
    progressForm,
    openProgress,
    handleAddProgress,
    updateProgressField,
    toggleActive,
  };
}
