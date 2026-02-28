"use client";

import { useState, useEffect, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getEmployees } from "@/modules/hr/actions";
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
} from "@/modules/performance/actions";

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
    perfKpiDefinitionName: "", perfKpiDefinitionDescription: "", perfKpiDefinitionCategory: "general", perfKpiDefinitionUnit: "",
    perfKpiDefinitionFrequency: "monthly", perfKpiDefinitionTargetValue: "", perfKpiDefinitionWarningThreshold: "",
    perfKpiDefinitionCriticalThreshold: "", perfKpiDefinitionHigherIsBetter: true,
  });
  const [savingDefinition, setSavingDefinition] = useState(false);

  // Assignment modal
  const assignmentModal = useDisclosure();
  const [assignForm, setAssignForm] = useState({
    perfKpiAssignmentDefinitionId: "", perfKpiAssignmentEmployeeId: "", perfKpiAssignmentYear: String(new Date().getFullYear()),
    perfKpiAssignmentTargetValue: "", perfKpiAssignmentWeight: "1",
  });
  const [savingAssignment, setSavingAssignment] = useState(false);

  // Record modal
  const recordModal = useDisclosure();
  const [recordingAssignment, setRecordingAssignment] = useState(null);
  const [recordForm, setRecordForm] = useState({
    perfKpiRecordPeriodLabel: "", perfKpiRecordActualValue: "", perfKpiRecordNote: "",
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
        const myEmp = (data || []).find((e) => e.hrEmployeeUserId === user.id);
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
        employeeId: currentEmployee?.hrEmployeeId || "",
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
        perfKpiDefinitionName: def.perfKpiDefinitionName, perfKpiDefinitionDescription: def.perfKpiDefinitionDescription || "",
        perfKpiDefinitionCategory: def.perfKpiDefinitionCategory, perfKpiDefinitionUnit: def.perfKpiDefinitionUnit,
        perfKpiDefinitionFrequency: def.perfKpiDefinitionFrequency, perfKpiDefinitionTargetValue: def.perfKpiDefinitionTargetValue != null ? String(def.perfKpiDefinitionTargetValue) : "",
        perfKpiDefinitionWarningThreshold: def.perfKpiDefinitionWarningThreshold != null ? String(def.perfKpiDefinitionWarningThreshold) : "",
        perfKpiDefinitionCriticalThreshold: def.perfKpiDefinitionCriticalThreshold != null ? String(def.perfKpiDefinitionCriticalThreshold) : "",
        perfKpiDefinitionHigherIsBetter: def.perfKpiDefinitionHigherIsBetter !== false,
      });
    } else {
      setEditingDefinition(null);
      setDefinitionForm({
        perfKpiDefinitionName: "", perfKpiDefinitionDescription: "", perfKpiDefinitionCategory: "general", perfKpiDefinitionUnit: "",
        perfKpiDefinitionFrequency: "monthly", perfKpiDefinitionTargetValue: "", perfKpiDefinitionWarningThreshold: "",
        perfKpiDefinitionCriticalThreshold: "", perfKpiDefinitionHigherIsBetter: true,
      });
    }
    definitionModal.onOpen();
  }, [definitionModal]);

  const handleSaveDefinition = useCallback(async () => {
    if (!definitionForm.perfKpiDefinitionName.trim() || !definitionForm.perfKpiDefinitionUnit.trim()) {
      toast.error("กรุณากรอกชื่อและหน่วย");
      return;
    }
    setSavingDefinition(true);
    try {
      const payload = {
        name: definitionForm.perfKpiDefinitionName,
        description: definitionForm.perfKpiDefinitionDescription,
        category: definitionForm.perfKpiDefinitionCategory,
        unit: definitionForm.perfKpiDefinitionUnit,
        frequency: definitionForm.perfKpiDefinitionFrequency,
        targetValue: definitionForm.perfKpiDefinitionTargetValue ? parseFloat(definitionForm.perfKpiDefinitionTargetValue) : null,
        warningThreshold: definitionForm.perfKpiDefinitionWarningThreshold ? parseFloat(definitionForm.perfKpiDefinitionWarningThreshold) : null,
        criticalThreshold: definitionForm.perfKpiDefinitionCriticalThreshold ? parseFloat(definitionForm.perfKpiDefinitionCriticalThreshold) : null,
        higherIsBetter: definitionForm.perfKpiDefinitionHigherIsBetter,
      };
      if (editingDefinition) {
        await updateKpiDefinition(editingDefinition.perfKpiDefinitionId, payload);
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

  const handleDeleteDefinition = useCallback(async (perfKpiDefinitionId) => {
    try {
      await deleteKpiDefinition(perfKpiDefinitionId);
      toast.success("ลบ KPI สำเร็จ");
      loadDefinitions();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadDefinitions]);

  // Assignment
  const handleOpenAssignForm = useCallback((perfKpiAssignmentDefinitionId = "") => {
    setAssignForm({
      perfKpiAssignmentDefinitionId, perfKpiAssignmentEmployeeId: "", perfKpiAssignmentYear: filterYear,
      perfKpiAssignmentTargetValue: "", perfKpiAssignmentWeight: "1",
    });
    // Pre-fill target from definition
    if (perfKpiAssignmentDefinitionId) {
      const def = definitions.find((d) => d.perfKpiDefinitionId === perfKpiAssignmentDefinitionId);
      if (def?.perfKpiDefinitionTargetValue) setAssignForm((f) => ({ ...f, perfKpiAssignmentTargetValue: String(def.perfKpiDefinitionTargetValue) }));
    }
    assignmentModal.onOpen();
  }, [assignmentModal, filterYear, definitions]);

  const handleSaveAssignment = useCallback(async () => {
    if (!assignForm.perfKpiAssignmentDefinitionId || !assignForm.perfKpiAssignmentEmployeeId || !assignForm.perfKpiAssignmentTargetValue) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setSavingAssignment(true);
    try {
      await createKpiAssignment({
        definitionId: assignForm.perfKpiAssignmentDefinitionId,
        employeeId: assignForm.perfKpiAssignmentEmployeeId,
        year: assignForm.perfKpiAssignmentYear,
        targetValue: assignForm.perfKpiAssignmentTargetValue,
        weight: assignForm.perfKpiAssignmentWeight,
      });
      toast.success("Assign KPI สำเร็จ");
      assignmentModal.onClose();
      loadDefinitions();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingAssignment(false);
    }
  }, [assignForm, assignmentModal, loadDefinitions]);

  const handleDeleteAssignment = useCallback(async (perfKpiAssignmentId) => {
    try {
      await deleteKpiAssignment(perfKpiAssignmentId);
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
    setRecordForm({ perfKpiRecordPeriodLabel: defaultPeriod, perfKpiRecordActualValue: "", perfKpiRecordNote: "" });
    recordModal.onOpen();
  }, [recordModal]);

  const handleSaveRecord = useCallback(async () => {
    if (!recordForm.perfKpiRecordPeriodLabel || recordForm.perfKpiRecordActualValue === "") {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setSavingRecord(true);
    try {
      await recordKpiValue({
        assignmentId: recordingAssignment.assignmentId,
        periodLabel: recordForm.perfKpiRecordPeriodLabel,
        actualValue: parseFloat(recordForm.perfKpiRecordActualValue),
        note: recordForm.perfKpiRecordNote || null,
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
  const loadRecords = useCallback(async (perfKpiAssignmentId) => {
    setLoadingRecords(true);
    try {
      const data = await getKpiRecords(perfKpiAssignmentId);
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
