"use client";

import { useState, useEffect, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getEmployees } from "@/actions/hr";
import {
  getKpiDefinitions,
  createKpiDefinition,
  updateKpiDefinition,
  deleteKpiDefinition,
  getKpiAssignments,
  createKpiAssignment,
  deleteKpiAssignment,
  getKpiRecords,
  recordKpiValue,
  getKpiDashboard,
} from "@/actions/performance";

export function useKpi() {
  const { user } = useAuth();

  // Tab
  const [activeTab, setActiveTab] = useState("myKpi");

  // Data
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Definitions (admin)
  const [definitions, setDefinitions] = useState([]);
  const [loadingDefinitions, setLoadingDefinitions] = useState(false);

  // Assignments
  const [myAssignments, setMyAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Dashboard
  const [dashboardData, setDashboardData] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Filters
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));

  // Definition form modal
  const definitionModal = useDisclosure();
  const [editingDefinition, setEditingDefinition] = useState(null);
  const [definitionForm, setDefinitionForm] = useState({
    name: "", description: "", category: "general", unit: "",
    frequency: "monthly", targetValue: "", warningThreshold: "",
    criticalThreshold: "", higherIsBetter: true,
  });
  const [savingDefinition, setSavingDefinition] = useState(false);

  // Assignment modal
  const assignmentModal = useDisclosure();
  const [assignForm, setAssignForm] = useState({
    definitionId: "", employeeId: "", year: String(new Date().getFullYear()),
    targetValue: "", weight: "1",
  });
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Record modal
  const recordModal = useDisclosure();
  const [recordingAssignment, setRecordingAssignment] = useState(null);
  const [recordForm, setRecordForm] = useState({
    periodLabel: "", actualValue: "", note: "",
  });
  const [savingRecord, setSavingRecord] = useState(false);

  // Records for trend
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Load employees
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data || []);
      if (user?.id) {
        const myEmp = (data || []).find((e) => e.employeeUserId === user.id);
        setCurrentEmployee(myEmp || null);
      }
    } catch {
      toast.error("ไม่สามารถโหลดรายชื่อพนักงานได้");
    } finally {
      setLoading(false);
    }
  };

  // Load definitions
  const loadDefinitions = useCallback(async () => {
    setLoadingDefinitions(true);
    try {
      const data = await getKpiDefinitions();
      setDefinitions(data || []);
    } catch {
      toast.error("ไม่สามารถโหลด KPI ได้");
    } finally {
      setLoadingDefinitions(false);
    }
  }, []);

  // Load my assignments with dashboard data
  const loadMyAssignments = useCallback(async () => {
    setLoadingAssignments(true);
    try {
      const data = await getKpiDashboard({
        year: filterYear,
        employeeId: currentEmployee?.employeeId || "",
      });
      setMyAssignments(data || []);
    } catch {
      toast.error("ไม่สามารถโหลด KPI ของฉันได้");
    } finally {
      setLoadingAssignments(false);
    }
  }, [filterYear, currentEmployee]);

  // Load dashboard (all employees)
  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const data = await getKpiDashboard({ year: filterYear });
      setDashboardData(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดแดชบอร์ดได้");
    } finally {
      setLoadingDashboard(false);
    }
  }, [filterYear]);

  // Load based on tab
  useEffect(() => {
    if (activeTab === "myKpi" && currentEmployee) loadMyAssignments();
    else if (activeTab === "dashboard") loadDashboard();
    else if (activeTab === "manage") loadDefinitions();
  }, [activeTab, loadMyAssignments, loadDashboard, loadDefinitions, currentEmployee]);

  // Definition CRUD
  const handleOpenDefinitionForm = useCallback((def = null) => {
    if (def) {
      setEditingDefinition(def);
      setDefinitionForm({
        name: def.name, description: def.description || "",
        category: def.category, unit: def.unit,
        frequency: def.frequency, targetValue: def.targetValue != null ? String(def.targetValue) : "",
        warningThreshold: def.warningThreshold != null ? String(def.warningThreshold) : "",
        criticalThreshold: def.criticalThreshold != null ? String(def.criticalThreshold) : "",
        higherIsBetter: def.higherIsBetter !== false,
      });
    } else {
      setEditingDefinition(null);
      setDefinitionForm({
        name: "", description: "", category: "general", unit: "",
        frequency: "monthly", targetValue: "", warningThreshold: "",
        criticalThreshold: "", higherIsBetter: true,
      });
    }
    definitionModal.onOpen();
  }, [definitionModal]);

  const handleSaveDefinition = useCallback(async () => {
    if (!definitionForm.name.trim() || !definitionForm.unit.trim()) {
      toast.error("กรุณากรอกชื่อและหน่วย");
      return;
    }
    setSavingDefinition(true);
    try {
      const payload = {
        ...definitionForm,
        targetValue: definitionForm.targetValue ? parseFloat(definitionForm.targetValue) : null,
        warningThreshold: definitionForm.warningThreshold ? parseFloat(definitionForm.warningThreshold) : null,
        criticalThreshold: definitionForm.criticalThreshold ? parseFloat(definitionForm.criticalThreshold) : null,
      };
      if (editingDefinition) {
        await updateKpiDefinition(editingDefinition.id, payload);
        toast.success("อัปเดต KPI สำเร็จ");
      } else {
        await createKpiDefinition(payload);
        toast.success("สร้าง KPI สำเร็จ");
      }
      definitionModal.onClose();
      loadDefinitions();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingDefinition(false);
    }
  }, [editingDefinition, definitionForm, definitionModal, loadDefinitions]);

  const handleDeleteDefinition = useCallback(async (id) => {
    try {
      await deleteKpiDefinition(id);
      toast.success("ลบ KPI สำเร็จ");
      loadDefinitions();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadDefinitions]);

  // Assignment
  const handleOpenAssignForm = useCallback((definitionId = "") => {
    setAssignForm({
      definitionId, employeeId: "", year: filterYear,
      targetValue: "", weight: "1",
    });
    // Pre-fill target from definition
    if (definitionId) {
      const def = definitions.find((d) => d.id === definitionId);
      if (def?.targetValue) setAssignForm((f) => ({ ...f, targetValue: String(def.targetValue) }));
    }
    assignmentModal.onOpen();
  }, [assignmentModal, filterYear, definitions]);

  const handleSaveAssignment = useCallback(async () => {
    if (!assignForm.definitionId || !assignForm.employeeId || !assignForm.targetValue) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setSavingAssignment(true);
    try {
      await createKpiAssignment(assignForm);
      toast.success("Assign KPI สำเร็จ");
      assignmentModal.onClose();
      loadDefinitions();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingAssignment(false);
    }
  }, [assignForm, assignmentModal, loadDefinitions]);

  const handleDeleteAssignment = useCallback(async (id) => {
    try {
      await deleteKpiAssignment(id);
      toast.success("ยกเลิก KPI assignment สำเร็จ");
      loadMyAssignments();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadMyAssignments]);

  // Record value
  const handleOpenRecordForm = useCallback((assignment) => {
    setRecordingAssignment(assignment);
    // Default period label: current month
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setRecordForm({ periodLabel: defaultPeriod, actualValue: "", note: "" });
    recordModal.onOpen();
  }, [recordModal]);

  const handleSaveRecord = useCallback(async () => {
    if (!recordForm.periodLabel || recordForm.actualValue === "") {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setSavingRecord(true);
    try {
      await recordKpiValue({
        assignmentId: recordingAssignment.assignmentId,
        periodLabel: recordForm.periodLabel,
        actualValue: parseFloat(recordForm.actualValue),
        note: recordForm.note || null,
      });
      toast.success("บันทึกค่า KPI สำเร็จ");
      recordModal.onClose();
      loadMyAssignments();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingRecord(false);
    }
  }, [recordingAssignment, recordForm, recordModal, loadMyAssignments]);

  // Load records for trend
  const loadRecords = useCallback(async (assignmentId) => {
    setLoadingRecords(true);
    try {
      const data = await getKpiRecords(assignmentId);
      setSelectedRecords(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  return {
    activeTab, setActiveTab,
    employees, currentEmployee, loading,
    // Definitions
    definitions, loadingDefinitions, loadDefinitions,
    definitionModal, editingDefinition, definitionForm, setDefinitionForm,
    savingDefinition, handleOpenDefinitionForm, handleSaveDefinition, handleDeleteDefinition,
    // Assignments
    myAssignments, loadingAssignments,
    assignmentModal, assignForm, setAssignForm,
    savingAssignment, handleOpenAssignForm, handleSaveAssignment, handleDeleteAssignment,
    // Records
    recordModal, recordingAssignment, recordForm, setRecordForm,
    savingRecord, handleOpenRecordForm, handleSaveRecord,
    selectedRecords, loadingRecords, loadRecords,
    // Dashboard
    dashboardData, loadingDashboard,
    // Filters
    filterYear, setFilterYear,
  };
}
