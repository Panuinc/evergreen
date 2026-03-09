"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getEmployees } from "@/modules/hr/actions";
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
} from "@/modules/performance/actions";

export function usePerfOkr() {
  const { user } = useAuth();


  const [activeTab, setActiveTab] = useState("myOkr");


  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);


  const [objectives, setObjectives] = useState([]);
  const [teamObjectives, setTeamObjectives] = useState([]);
  const [companyObjectives, setCompanyObjectives] = useState([]);
  const [loadingObjectives, setLoadingObjectives] = useState(false);


  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));
  const [filterQuarter, setFilterQuarter] = useState(String(Math.ceil((new Date().getMonth() + 1) / 3)));


  const objectiveModal = useDisclosure();
  const [editingObjective, setEditingObjective] = useState(null);
  const [objectiveForm, setObjectiveForm] = useState({
    perfOkrObjectiveTitle: "",
    perfOkrObjectiveDescription: "",
    perfOkrObjectiveYear: String(new Date().getFullYear()),
    perfOkrObjectiveQuarter: String(Math.ceil((new Date().getMonth() + 1) / 3)),
    perfOkrObjectiveVisibility: "team",
  });
  const [savingObjective, setSavingObjective] = useState(false);


  const krModal = useDisclosure();
  const [editingKr, setEditingKr] = useState(null);
  const [krForm, setKrForm] = useState({
    perfOkrKeyResultObjectiveId: "",
    perfOkrKeyResultTitle: "",
    perfOkrKeyResultMetricType: "number",
    perfOkrKeyResultStartValue: "0",
    perfOkrKeyResultTargetValue: "",
    perfOkrKeyResultUnit: "",
    perfOkrKeyResultWeight: "1",
  });
  const [savingKr, setSavingKr] = useState(false);


  const checkinModal = useDisclosure();
  const [checkinKr, setCheckinKr] = useState(null);
  const [checkinValue, setCheckinValue] = useState("");
  const [checkinNote, setCheckinNote] = useState("");
  const [savingCheckin, setSavingCheckin] = useState(false);


  const [checkins, setCheckins] = useState([]);
  const [loadingCheckins, setLoadingCheckins] = useState(false);


  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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


  useEffect(() => {
    if (activeTab === "myOkr") loadMyObjectives();
    else if (activeTab === "teamOkr") loadTeamObjectives();
    else if (activeTab === "companyOkr") loadCompanyObjectives();
  }, [activeTab, loadMyObjectives, loadTeamObjectives, loadCompanyObjectives]);


  const handleOpenObjectiveForm = useCallback((obj = null) => {
    if (obj) {
      setEditingObjective(obj);
      setObjectiveForm({
        perfOkrObjectiveTitle: obj.perfOkrObjectiveTitle,
        perfOkrObjectiveDescription: obj.perfOkrObjectiveDescription || "",
        perfOkrObjectiveYear: String(obj.perfOkrObjectiveYear),
        perfOkrObjectiveQuarter: String(obj.perfOkrObjectiveQuarter),
        perfOkrObjectiveVisibility: obj.perfOkrObjectiveVisibility || "team",
      });
    } else {
      setEditingObjective(null);
      setObjectiveForm({
        perfOkrObjectiveTitle: "",
        perfOkrObjectiveDescription: "",
        perfOkrObjectiveYear: filterYear,
        perfOkrObjectiveQuarter: filterQuarter,
        perfOkrObjectiveVisibility: "team",
      });
    }
    objectiveModal.onOpen();
  }, [objectiveModal, filterYear, filterQuarter]);

  const handleSaveObjective = useCallback(async () => {
    if (!objectiveForm.perfOkrObjectiveTitle.trim()) {
      toast.error("กรุณากรอกชื่อ Objective");
      return;
    }
    setSavingObjective(true);
    try {
      if (editingObjective) {
        await updateObjective(editingObjective.perfOkrObjectiveId, {
          title: objectiveForm.perfOkrObjectiveTitle,
          description: objectiveForm.perfOkrObjectiveDescription,
          visibility: objectiveForm.perfOkrObjectiveVisibility,
        });
        toast.success("อัปเดต Objective สำเร็จ");
      } else {
        await createObjective({
          title: objectiveForm.perfOkrObjectiveTitle,
          description: objectiveForm.perfOkrObjectiveDescription,
          year: objectiveForm.perfOkrObjectiveYear,
          quarter: objectiveForm.perfOkrObjectiveQuarter,
          visibility: objectiveForm.perfOkrObjectiveVisibility,
        });
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

  const handleDeleteObjective = useCallback(async (perfOkrObjectiveId) => {
    try {
      await deleteObjective(perfOkrObjectiveId);
      toast.success("ลบ Objective สำเร็จ");
      loadMyObjectives();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadMyObjectives]);

  const handleUpdateObjectiveStatus = useCallback(async (perfOkrObjectiveId, status) => {
    try {
      await updateObjective(perfOkrObjectiveId, { status });
      toast.success("อัปเดตสถานะสำเร็จ");
      loadMyObjectives();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadMyObjectives]);


  const handleOpenKrForm = useCallback((perfOkrKeyResultObjectiveId, kr = null) => {
    if (kr) {
      setEditingKr(kr);
      setKrForm({
        perfOkrKeyResultObjectiveId,
        perfOkrKeyResultTitle: kr.perfOkrKeyResultTitle,
        perfOkrKeyResultMetricType: kr.perfOkrKeyResultMetricType,
        perfOkrKeyResultStartValue: String(kr.perfOkrKeyResultStartValue),
        perfOkrKeyResultTargetValue: String(kr.perfOkrKeyResultTargetValue),
        perfOkrKeyResultUnit: kr.perfOkrKeyResultUnit || "",
        perfOkrKeyResultWeight: String(kr.perfOkrKeyResultWeight),
      });
    } else {
      setEditingKr(null);
      setKrForm({
        perfOkrKeyResultObjectiveId,
        perfOkrKeyResultTitle: "",
        perfOkrKeyResultMetricType: "number",
        perfOkrKeyResultStartValue: "0",
        perfOkrKeyResultTargetValue: "",
        perfOkrKeyResultUnit: "",
        perfOkrKeyResultWeight: "1",
      });
    }
    krModal.onOpen();
  }, [krModal]);

  const handleSaveKr = useCallback(async () => {
    if (!krForm.perfOkrKeyResultTitle.trim() || !krForm.perfOkrKeyResultTargetValue) {
      toast.error("กรุณากรอกชื่อและเป้าหมาย");
      return;
    }
    setSavingKr(true);
    try {
      if (editingKr) {
        await updateKeyResult(editingKr.perfOkrKeyResultId, {
          title: krForm.perfOkrKeyResultTitle,
          metricType: krForm.perfOkrKeyResultMetricType,
          startValue: parseFloat(krForm.perfOkrKeyResultStartValue),
          targetValue: parseFloat(krForm.perfOkrKeyResultTargetValue),
          unit: krForm.perfOkrKeyResultUnit || null,
          weight: parseFloat(krForm.perfOkrKeyResultWeight),
        });
        toast.success("อัปเดต Key Result สำเร็จ");
      } else {
        await createKeyResult({
          objectiveId: krForm.perfOkrKeyResultObjectiveId,
          title: krForm.perfOkrKeyResultTitle,
          metricType: krForm.perfOkrKeyResultMetricType,
          startValue: parseFloat(krForm.perfOkrKeyResultStartValue),
          targetValue: parseFloat(krForm.perfOkrKeyResultTargetValue),
          unit: krForm.perfOkrKeyResultUnit || null,
          weight: parseFloat(krForm.perfOkrKeyResultWeight),
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

  const handleDeleteKr = useCallback(async (perfOkrKeyResultId) => {
    try {
      await deleteKeyResult(perfOkrKeyResultId);
      toast.success("ลบ Key Result สำเร็จ");
      loadMyObjectives();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadMyObjectives]);


  const handleOpenCheckin = useCallback((kr) => {
    setCheckinKr(kr);
    setCheckinValue(String(kr.perfOkrKeyResultCurrentValue));
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
        keyResultId: checkinKr.perfOkrKeyResultId,
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

  const loadCheckinHistory = useCallback(async (perfOkrKeyResultId) => {
    setLoadingCheckins(true);
    try {
      const data = await getCheckins(perfOkrKeyResultId);
      setCheckins(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดประวัติ Check-in ได้");
    } finally {
      setLoadingCheckins(false);
    }
  }, []);

  return {

    activeTab, setActiveTab,

    employees, currentEmployee, loading,

    objectives, teamObjectives, companyObjectives, loadingObjectives,

    filterYear, setFilterYear, filterQuarter, setFilterQuarter,

    objectiveModal, editingObjective, objectiveForm, setObjectiveForm,
    savingObjective, handleOpenObjectiveForm, handleSaveObjective,
    handleDeleteObjective, handleUpdateObjectiveStatus,

    krModal, editingKr, krForm, setKrForm, savingKr,
    handleOpenKrForm, handleSaveKr, handleDeleteKr,

    checkinModal, checkinKr, checkinValue, setCheckinValue,
    checkinNote, setCheckinNote, savingCheckin,
    handleOpenCheckin, handleSaveCheckin,
    checkins, loadingCheckins, loadCheckinHistory,
  };
}
