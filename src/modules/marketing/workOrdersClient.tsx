"use client";

import { useState, useEffect, useMemo } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import useSWR from "swr";
import { get, post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import { useAuth } from "@/contexts/authContext";
import WorkOrdersView from "@/modules/marketing/components/workOrdersView";
import type { MktWorkOrder, WorkOrderFormData, WorkOrderProgressForm, MktWorkOrderProgressLog, HrEmployee } from "@/modules/marketing/types";

const emptyForm = {
  mktWorkOrderTitle: "",
  mktWorkOrderDescription: "",
  mktWorkOrderType: "",
  mktWorkOrderRequestedBy: "",
  mktWorkOrderAssignedTo: "",
  mktWorkOrderPriority: "medium",
  mktWorkOrderStatus: "pending",
  mktWorkOrderProgress: "0",
  mktWorkOrderStartDate: "",
  mktWorkOrderDueDate: "",
  mktWorkOrderNotes: "",
};

const emptyProgressForm = {
  mktWorkOrderProgressLogDescription: "",
  mktWorkOrderProgressLogProgress: "",
  mktWorkOrderProgressLogCreatedBy: "",
};

export default function WorkOrdersClient() {
  const { user } = useAuth();
  const fetcher = (url: string) => get<MktWorkOrder[]>(url);
  const { data: workOrdersData, isLoading: woLoading, mutate: mutateWorkOrders } = useSWR<MktWorkOrder[]>(
    user ? "/api/marketing/workOrders" : null,
    fetcher,
  );
  const { data: employeesData, isLoading: empLoading } = useSWR<HrEmployee[]>(
    user ? "/api/hr/employees" : null,
    (url: string) => get<HrEmployee[]>(url).catch(() => []),
  );

  const workOrders = workOrdersData || [];
  const employees = useMemo(() => employeesData || [], [employeesData]);
  const loading = woLoading || empLoading;

  const currentEmployeeName = useMemo(() => {
    if (!user?.id || !employees.length) return user?.email || "";
    const myEmp = employees.find((e) => e.hrEmployeeUserId === user.id);
    return myEmp ? `${myEmp.hrEmployeeFirstName} ${myEmp.hrEmployeeLastName}` : (user.email || "");
  }, [user, employees]);

  const [saving, setSaving] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<MktWorkOrder | null>(null);
  const [formData, setFormData] = useState<WorkOrderFormData>(emptyForm);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingWorkOrder, setDeletingWorkOrder] = useState<MktWorkOrder | null>(null);

  const progressModal = useDisclosure();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<MktWorkOrder | null>(null);
  const [progressLogs, setProgressLogs] = useState<MktWorkOrderProgressLog[]>([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressForm, setProgressForm] = useState<WorkOrderProgressForm>(emptyProgressForm);


  const handleOpen = (workOrder = null) => {
    if (workOrder) {
      setEditingWorkOrder(workOrder);
      setFormData({
        mktWorkOrderTitle: workOrder.mktWorkOrderTitle || "",
        mktWorkOrderDescription: workOrder.mktWorkOrderDescription || "",
        mktWorkOrderType: workOrder.mktWorkOrderType || "",
        mktWorkOrderRequestedBy: workOrder.mktWorkOrderRequestedBy || currentEmployeeName,
        mktWorkOrderAssignedTo: workOrder.mktWorkOrderAssignedTo || "",
        mktWorkOrderPriority: workOrder.mktWorkOrderPriority || "medium",
        mktWorkOrderStatus: workOrder.mktWorkOrderStatus || "pending",
        mktWorkOrderProgress: workOrder.mktWorkOrderProgress?.toString() || "0",
        mktWorkOrderStartDate: workOrder.mktWorkOrderStartDate || "",
        mktWorkOrderDueDate: workOrder.mktWorkOrderDueDate || "",
        mktWorkOrderNotes: workOrder.mktWorkOrderNotes || "",
      });
    } else {
      setEditingWorkOrder(null);
      setFormData({ ...emptyForm, mktWorkOrderRequestedBy: currentEmployeeName });
    }
    setValidationErrors({});
    onOpen();
  };

  const handleSave = async () => {
    const { isValid, errors } = validateForm(formData, {
      mktWorkOrderTitle: [(v) => !isRequired(v) && "กรุณาระบุชื่องาน"],
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
        mktWorkOrderProgress: parseInt(formData.mktWorkOrderProgress) || 0,
      };
      if (editingWorkOrder) {
        await put(`/api/marketing/workOrders/${editingWorkOrder.mktWorkOrderId}`, payload);
        toast.success("อัปเดตใบสั่งงานสำเร็จ");
      } else {
        await post("/api/marketing/workOrders", payload);
        toast.success("สร้างใบสั่งงานสำเร็จ");
      }
      onClose();
      mutateWorkOrders();
    } catch (error) {
      toast.error(error.message || "บันทึกใบสั่งงานล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (workOrder) => {
    setDeletingWorkOrder(workOrder);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingWorkOrder) return;
    try {
      await del(`/api/marketing/workOrders/${deletingWorkOrder.mktWorkOrderId}`);
      toast.success("ลบใบสั่งงานสำเร็จ");
      deleteModal.onClose();
      setDeletingWorkOrder(null);
      mutateWorkOrders();
    } catch (error) {
      toast.error(error.message || "ลบใบสั่งงานล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/marketing/workOrders/${item.mktWorkOrderId}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      mutateWorkOrders();
    } catch (error) {
      toast.error("เปลี่ยนสถานะล้มเหลว");
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openProgress = async (workOrder) => {
    setSelectedWorkOrder(workOrder);
    setProgressForm({
      ...emptyProgressForm,
      mktWorkOrderProgressLogProgress: workOrder.mktWorkOrderProgress?.toString() || "0",
    });
    progressModal.onOpen();
    try {
      setProgressLoading(true);
      const logs = await get<MktWorkOrderProgressLog[]>(`/api/marketing/workOrders/${workOrder.mktWorkOrderId}/progress`);
      setProgressLogs(logs ?? []);
    } catch {
      toast.error("โหลดบันทึกความคืบหน้าล้มเหลว");
    } finally {
      setProgressLoading(false);
    }
  };

  const handleAddProgress = async () => {
    if (!progressForm.mktWorkOrderProgressLogDescription.trim()) {
      toast.error("กรุณาระบุรายละเอียด");
      return;
    }
    if (!progressForm.mktWorkOrderProgressLogProgress) {
      toast.error("กรุณาระบุเปอร์เซ็นต์ความคืบหน้า");
      return;
    }

    try {
      setProgressSaving(true);
      await post(`/api/marketing/workOrders/${selectedWorkOrder.mktWorkOrderId}/progress`, {
        mktWorkOrderProgressLogDescription: progressForm.mktWorkOrderProgressLogDescription,
        mktWorkOrderProgressLogProgress: parseInt(progressForm.mktWorkOrderProgressLogProgress) || 0,
        mktWorkOrderProgressLogCreatedBy: progressForm.mktWorkOrderProgressLogCreatedBy,
      });
      toast.success("อัปเดตความคืบหน้าสำเร็จ");

      const logs = await get<MktWorkOrderProgressLog[]>(`/api/marketing/workOrders/${selectedWorkOrder.mktWorkOrderId}/progress`);
      setProgressLogs(logs ?? []);
      setProgressForm({
        ...emptyProgressForm,
        mktWorkOrderProgressLogProgress: progressForm.mktWorkOrderProgressLogProgress,
      });
      mutateWorkOrders();

      setSelectedWorkOrder((prev) => ({
        ...prev,
        mktWorkOrderProgress: parseInt(progressForm.mktWorkOrderProgressLogProgress) || 0,
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
    <WorkOrdersView
      workOrders={workOrders}
      employees={employees}
      loading={loading}
      saving={saving}
      editingWorkOrder={editingWorkOrder}
      formData={formData}
      validationErrors={validationErrors}
      deletingWorkOrder={deletingWorkOrder}
      isOpen={isOpen}
      onClose={onClose}
      deleteModal={deleteModal}
      updateField={updateField}
      handleOpen={handleOpen}
      handleSave={handleSave}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      progressModal={progressModal}
      selectedWorkOrder={selectedWorkOrder}
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
