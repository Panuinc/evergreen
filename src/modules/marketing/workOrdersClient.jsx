"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { get, post, put, del } from "@/lib/apiClient";
import { validateForm, isRequired } from "@/lib/validation";
import { useAuth } from "@/contexts/authContext";
import WorkOrdersView from "@/modules/marketing/components/workOrdersView";

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
  const [workOrders, setWorkOrders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentEmployeeName, setCurrentEmployeeName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const deleteModal = useDisclosure();
  const [deletingWorkOrder, setDeletingWorkOrder] = useState(null);

  const progressModal = useDisclosure();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [progressLogs, setProgressLogs] = useState([]);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressForm, setProgressForm] = useState(emptyProgressForm);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [data, emps] = await Promise.all([get("/api/marketing/workOrders"), get("/api/hr/employees").catch(() => [])]);
      setWorkOrders(data);
      setEmployees(emps);
      if (user?.id) {
        const myEmp = emps.find((e) => e.hrEmployeeUserId === user.id);
        if (myEmp) {
          setCurrentEmployeeName(`${myEmp.hrEmployeeFirstName} ${myEmp.hrEmployeeLastName}`);
        } else {
          setCurrentEmployeeName(user.email || "");
        }
      }
    } catch (error) {
      toast.error("โหลดใบสั่งงานล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

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
      Object.values(errors).forEach((msg) => toast.error(msg));
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
        await put(`/api/marketing/workOrders/${editingWorkOrder.id}`, payload);
        toast.success("อัปเดตใบสั่งงานสำเร็จ");
      } else {
        await post("/api/marketing/workOrders", payload);
        toast.success("สร้างใบสั่งงานสำเร็จ");
      }
      onClose();
      loadData();
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
      await del(`/api/marketing/workOrders/${deletingWorkOrder.id}`);
      toast.success("ลบใบสั่งงานสำเร็จ");
      deleteModal.onClose();
      setDeletingWorkOrder(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบใบสั่งงานล้มเหลว");
    }
  };

  const toggleActive = async (item) => {
    try {
      await put(`/api/marketing/workOrders/${item.id}`, { isActive: !item.isActive });
      toast.success(item.isActive ? "ปิดการใช้งานสำเร็จ" : "เปิดการใช้งานสำเร็จ");
      loadData();
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
      const logs = await get(`/api/marketing/workOrders/${workOrder.id}/progress`);
      setProgressLogs(logs);
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
      await post(`/api/marketing/workOrders/${selectedWorkOrder.id}/progress`, {
        mktWorkOrderProgressLogDescription: progressForm.mktWorkOrderProgressLogDescription,
        mktWorkOrderProgressLogProgress: parseInt(progressForm.mktWorkOrderProgressLogProgress) || 0,
        mktWorkOrderProgressLogCreatedBy: progressForm.mktWorkOrderProgressLogCreatedBy,
      });
      toast.success("อัปเดตความคืบหน้าสำเร็จ");

      const logs = await get(`/api/marketing/workOrders/${selectedWorkOrder.id}/progress`);
      setProgressLogs(logs);
      setProgressForm({
        ...emptyProgressForm,
        mktWorkOrderProgressLogProgress: progressForm.mktWorkOrderProgressLogProgress,
      });
      loadData();

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
