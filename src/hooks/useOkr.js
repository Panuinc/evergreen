"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getEmployees } from "@/actions/hr";
import {
  getObjectives,
  createObjective,
  updateObjective,
  deleteObjective,
  createKeyResult,
  updateKeyResult,
  deleteKeyResult,
  getCheckins,
  createCheckin,
} from "@/actions/performance";

export function useOkr() {
  const { user } = useAuth();

  // Tab
  const [activeTab, setActiveTab] = useState("myOkr");

  // Employee data
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Objectives
  const [objectives, setObjectives] = useState([]);
  const [teamObjectives, setTeamObjectives] = useState([]);
  const [companyObjectives, setCompanyObjectives] = useState([]);
  const [loadingObjectives, setLoadingObjectives] = useState(false);

  // Filters
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterQuarter, setFilterQuarter] = useState(String(Math.ceil((new Date().getMonth() + 1) / 3)));

  // Objective form modal
  const objectiveModal = useDisclosure();
  const [editingObjective, setEditingObjective] = useState(null);
  const [objectiveForm, setObjectiveForm] = useState({
    title: "",
    description: "",
    year: String(new Date().getFullYear()),
    quarter: String(Math.ceil((new Date().getMonth() + 1) / 3)),
    visibility: "team",
  });
  const [savingObjective, setSavingObjective] = useState(false);

  // Key Result form
  const krModal = useDisclosure();
  const [editingKr, setEditingKr] = useState(null);
  const [krForm, setKrForm] = useState({
    objectiveId: "",
    title: "",
    metricType: "number",
    startValue: "0",
    targetValue: "",
    unit: "",
    weight: "1",
  });
  const [savingKr, setSavingKr] = useState(false);

  // Check-in modal
  const checkinModal = useDisclosure();
  const [checkinKr, setCheckinKr] = useState(null);
  const [checkinValue, setCheckinValue] = useState("");
  const [checkinNote, setCheckinNote] = useState("");
  const [savingCheckin, setSavingCheckin] = useState(false);

  // Check-in history
  const [checkins, setCheckins] = useState([]);
  const [loadingCheckins, setLoadingCheckins] = useState(false);

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

  // Load objectives based on tab
  const loadMyObjectives = useCallback(async () => {
    setLoadingObjectives(true);
    try {
      const data = await getObjectives({ year: filterYear, quarter: filterQuarter });
      setObjectives(data || []);
    } catch {
      toast.error("ไม่สามารถโหลด OKR ได้");
    } finally {
      setLoadingObjectives(false);
    }
  }, [filterYear, filterQuarter]);

  const loadTeamObjectives = useCallback(async () => {
    setLoadingObjectives(true);
    try {
      const data = await getObjectives({ visibility: "team", year: filterYear, quarter: filterQuarter });
      setTeamObjectives(data || []);
    } catch {
      toast.error("ไม่สามารถโหลด OKR ทีมได้");
    } finally {
      setLoadingObjectives(false);
    }
  }, [filterYear, filterQuarter]);

  const loadCompanyObjectives = useCallback(async () => {
    setLoadingObjectives(true);
    try {
      const data = await getObjectives({ visibility: "company", year: filterYear, quarter: filterQuarter });
      setCompanyObjectives(data || []);
    } catch {
      toast.error("ไม่สามารถโหลด OKR บริษัทได้");
    } finally {
      setLoadingObjectives(false);
    }
  }, [filterYear, filterQuarter]);

  // Reload on tab/filter change
  useEffect(() => {
    if (activeTab === "myOkr") loadMyObjectives();
    else if (activeTab === "teamOkr") loadTeamObjectives();
    else if (activeTab === "companyOkr") loadCompanyObjectives();
  }, [activeTab, loadMyObjectives, loadTeamObjectives, loadCompanyObjectives]);

  // Objective CRUD
  const handleOpenObjectiveForm = useCallback((obj = null) => {
    if (obj) {
      setEditingObjective(obj);
      setObjectiveForm({
        title: obj.title,
        description: obj.description || "",
        year: String(obj.year),
        quarter: String(obj.quarter),
        visibility: obj.visibility || "team",
      });
    } else {
      setEditingObjective(null);
      setObjectiveForm({
        title: "",
        description: "",
        year: filterYear,
        quarter: filterQuarter,
        visibility: "team",
      });
    }
    objectiveModal.onOpen();
  }, [objectiveModal, filterYear, filterQuarter]);

  const handleSaveObjective = useCallback(async () => {
    if (!objectiveForm.title.trim()) {
      toast.error("กรุณากรอกชื่อ Objective");
      return;
    }
    setSavingObjective(true);
    try {
      if (editingObjective) {
        await updateObjective(editingObjective.id, {
          title: objectiveForm.title,
          description: objectiveForm.description,
          visibility: objectiveForm.visibility,
        });
        toast.success("อัปเดต Objective สำเร็จ");
      } else {
        await createObjective(objectiveForm);
        toast.success("สร้าง Objective สำเร็จ");
      }
      objectiveModal.onClose();
      loadMyObjectives();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingObjective(false);
    }
  }, [editingObjective, objectiveForm, objectiveModal, loadMyObjectives]);

  const handleDeleteObjective = useCallback(async (id) => {
    try {
      await deleteObjective(id);
      toast.success("ลบ Objective สำเร็จ");
      loadMyObjectives();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadMyObjectives]);

  const handleUpdateObjectiveStatus = useCallback(async (id, status) => {
    try {
      await updateObjective(id, { status });
      toast.success("อัปเดตสถานะสำเร็จ");
      loadMyObjectives();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadMyObjectives]);

  // Key Result CRUD
  const handleOpenKrForm = useCallback((objectiveId, kr = null) => {
    if (kr) {
      setEditingKr(kr);
      setKrForm({
        objectiveId,
        title: kr.title,
        metricType: kr.metricType,
        startValue: String(kr.startValue),
        targetValue: String(kr.targetValue),
        unit: kr.unit || "",
        weight: String(kr.weight),
      });
    } else {
      setEditingKr(null);
      setKrForm({
        objectiveId,
        title: "",
        metricType: "number",
        startValue: "0",
        targetValue: "",
        unit: "",
        weight: "1",
      });
    }
    krModal.onOpen();
  }, [krModal]);

  const handleSaveKr = useCallback(async () => {
    if (!krForm.title.trim() || !krForm.targetValue) {
      toast.error("กรุณากรอกชื่อและเป้าหมาย");
      return;
    }
    setSavingKr(true);
    try {
      if (editingKr) {
        await updateKeyResult(editingKr.id, {
          title: krForm.title,
          metricType: krForm.metricType,
          startValue: parseFloat(krForm.startValue),
          targetValue: parseFloat(krForm.targetValue),
          unit: krForm.unit || null,
          weight: parseFloat(krForm.weight),
        });
        toast.success("อัปเดต Key Result สำเร็จ");
      } else {
        await createKeyResult({
          objectiveId: krForm.objectiveId,
          title: krForm.title,
          metricType: krForm.metricType,
          startValue: parseFloat(krForm.startValue),
          targetValue: parseFloat(krForm.targetValue),
          unit: krForm.unit || null,
          weight: parseFloat(krForm.weight),
        });
        toast.success("สร้าง Key Result สำเร็จ");
      }
      krModal.onClose();
      loadMyObjectives();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingKr(false);
    }
  }, [editingKr, krForm, krModal, loadMyObjectives]);

  const handleDeleteKr = useCallback(async (id) => {
    try {
      await deleteKeyResult(id);
      toast.success("ลบ Key Result สำเร็จ");
      loadMyObjectives();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadMyObjectives]);

  // Check-in
  const handleOpenCheckin = useCallback((kr) => {
    setCheckinKr(kr);
    setCheckinValue(String(kr.currentValue));
    setCheckinNote("");
    checkinModal.onOpen();
  }, [checkinModal]);

  const handleSaveCheckin = useCallback(async () => {
    if (!checkinKr || checkinValue === "") {
      toast.error("กรุณากรอกค่าใหม่");
      return;
    }
    setSavingCheckin(true);
    try {
      await createCheckin({
        keyResultId: checkinKr.id,
        newValue: parseFloat(checkinValue),
        note: checkinNote || null,
      });
      toast.success("บันทึก Check-in สำเร็จ");
      checkinModal.onClose();
      loadMyObjectives();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingCheckin(false);
    }
  }, [checkinKr, checkinValue, checkinNote, checkinModal, loadMyObjectives]);

  const loadCheckinHistory = useCallback(async (keyResultId) => {
    setLoadingCheckins(true);
    try {
      const data = await getCheckins(keyResultId);
      setCheckins(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดประวัติ Check-in ได้");
    } finally {
      setLoadingCheckins(false);
    }
  }, []);

  return {
    // Tab
    activeTab, setActiveTab,
    // Data
    employees, currentEmployee, loading,
    // Objectives
    objectives, teamObjectives, companyObjectives, loadingObjectives,
    // Filters
    filterYear, setFilterYear, filterQuarter, setFilterQuarter,
    // Objective CRUD
    objectiveModal, editingObjective, objectiveForm, setObjectiveForm,
    savingObjective, handleOpenObjectiveForm, handleSaveObjective,
    handleDeleteObjective, handleUpdateObjectiveStatus,
    // KR CRUD
    krModal, editingKr, krForm, setKrForm, savingKr,
    handleOpenKrForm, handleSaveKr, handleDeleteKr,
    // Check-in
    checkinModal, checkinKr, checkinValue, setCheckinValue,
    checkinNote, setCheckinNote, savingCheckin,
    handleOpenCheckin, handleSaveCheckin,
    checkins, loadingCheckins, loadCheckinHistory,
  };
}
