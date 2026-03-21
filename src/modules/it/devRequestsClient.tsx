"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import { useAuth } from "@/contexts/authContext";
import DevelopmentView from "@/modules/it/components/developmentView";

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

export default function DevRequestsClient({ initialRequests, initialEmployees }) {
  const { user } = useAuth();
  const [requests, setRequests] = useState(initialRequests);
  const [employees] = useState(initialEmployees);
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

  // Derive current employee name from initialEmployees
  const currentEmployeeName = (() => {
    if (!user?.id) return "";
    const myEmp = initialEmployees.find((e) => e.hrEmployeeUserId === user.id);
    return myEmp ? `${myEmp.hrEmployeeFirstName} ${myEmp.hrEmployeeLastName}` : "";
  })();

  const reloadRequests = async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get("/api/it/devRequests");
      setRequests(data);
    } catch {}
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
      Object.values(errors).forEach((msg) => toast.error(msg as string));
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
        await put(`/api/it/devRequests/${editingRequest.itDevRequestId}`, payload);
        toast.success("อัปเดตคำขอสำเร็จ");
      } else {
        await post("/api/it/devRequests", payload);
        toast.success("สร้างคำขอสำเร็จ");
      }
      onClose();
      reloadRequests();
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
      await del(`/api/it/devRequests/${deletingRequest.itDevRequestId}`);
      toast.success("ลบคำขอสำเร็จ");
      deleteModal.onClose();
      setDeletingRequest(null);
      reloadRequests();
    } catch (error) {
      toast.error(error.message || "ลบคำขอล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/it/devRequests/${item.itDevRequestId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      reloadRequests();
    } catch {
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
      const { get } = await import("@/lib/apiClient");
      const logs = await get(`/api/it/devRequests/${request.itDevRequestId}/progress`);
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
      await post(`/api/it/devRequests/${selectedRequest.itDevRequestId}/progress`, {
        itDevProgressLogDescription: progressForm.itDevProgressLogDescription,
        itDevProgressLogProgress: parseInt(progressForm.itDevProgressLogProgress) || 0,
        itDevProgressLogCreatedBy: progressForm.itDevProgressLogCreatedBy,
      });
      toast.success("อัปเดตความคืบหน้าสำเร็จ");

      const { get } = await import("@/lib/apiClient");
      const logs = await get(`/api/it/devRequests/${selectedRequest.itDevRequestId}/progress`);
      setProgressLogs(logs);
      setProgressForm({
        ...emptyProgressForm,
        itDevProgressLogProgress: progressForm.itDevProgressLogProgress,
      });
      reloadRequests();

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

  return (
    <DevelopmentView
      requests={requests}
      employees={employees}
      loading={false}
      saving={saving}
      editingRequest={editingRequest}
      formData={formData}
      validationErrors={validationErrors}
      deletingRequest={deletingRequest}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      progressModal={progressModal}
      selectedRequest={selectedRequest}
      progressLogs={progressLogs}
      progressLoading={progressLoading}
      progressSaving={progressSaving}
      progressForm={progressForm}
      openProgress={openProgress}
      handleAddProgress={handleAddProgress}
      updateProgressField={updateProgressField}
      toggleActive={toggleActive}
    />
  );
}
