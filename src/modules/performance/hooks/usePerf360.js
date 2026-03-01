"use client";

import { useState, useEffect, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getEmployees } from "@/modules/hr/actions";
import {
  getFeedback360Cycles,
  createFeedback360Cycle,
  updateFeedback360Cycle,
  deleteFeedback360Cycle,
  transitionFeedback360Cycle,
  getFeedback360Competencies,
  saveFeedback360Competencies,
  getFeedback360Nominations,
  createFeedback360Nomination,
  deleteFeedback360Nomination,
  getMyPendingFeedback360Reviews,
  submitFeedback360Response,
  getFeedback360Results,
} from "@/modules/performance/actions";
import { DEFAULT_COMPETENCY_TEMPLATES } from "@/lib/performance/feedback360Constants";

export function usePerf360() {
  const { user } = useAuth();

  // Tab
  const [activeTab, setActiveTab] = useState("pending");

  // Data
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cycles
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [loadingCycles, setLoadingCycles] = useState(false);

  // Cycle form
  const cycleModal = useDisclosure();
  const [editingCycle, setEditingCycle] = useState(null);
  const [cycleForm, setCycleForm] = useState({
    perf360CycleName: "", perf360CycleDescription: "", perf360CycleYear: String(new Date().getFullYear()),
    perf360CycleQuarter: "", perf360CycleResponseDeadline: "", perf360CycleAnonymousToReviewee: true,
  });
  const [savingCycle, setSavingCycle] = useState(false);

  // Competencies
  const [competencies, setCompetencies] = useState([]);
  const [loadingCompetencies, setLoadingCompetencies] = useState(false);
  const [savingCompetencies, setSavingCompetencies] = useState(false);

  // Nominations
  const [nominations, setNominations] = useState([]);
  const [loadingNominations, setLoadingNominations] = useState(false);
  const nominationModal = useDisclosure();
  const [nominationForm, setNominationForm] = useState({
    perf360NominationRevieweeEmployeeId: "", perf360NominationReviewerEmployeeId: "", perf360NominationRelationshipType: "peer",
  });
  const [savingNomination, setSavingNomination] = useState(false);

  // Pending reviews
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);

  // Review form
  const reviewModal = useDisclosure();
  const [activeReview, setActiveReview] = useState(null);
  const [reviewCompetencies, setReviewCompetencies] = useState([]);
  const [reviewScores, setReviewScores] = useState({});
  const [reviewComments, setReviewComments] = useState({
    perf360ResponseStrengthComment: "", perf360ResponseImprovementComment: "", perf360ResponseComment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Results
  const [myResults, setMyResults] = useState(null);
  const [allResults, setAllResults] = useState(null);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultCycleId, setResultCycleId] = useState("");

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

  // Load cycles
  const loadCycles = useCallback(async () => {
    setLoadingCycles(true);
    try {
      const data = await getFeedback360Cycles();
      setCycles(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดรอบประเมินได้");
    } finally {
      setLoadingCycles(false);
    }
  }, []);

  // Load pending reviews
  const loadPendingReviews = useCallback(async () => {
    setLoadingPending(true);
    try {
      const data = await getMyPendingFeedback360Reviews();
      setPendingReviews(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดรายการรอประเมินได้");
    } finally {
      setLoadingPending(false);
    }
  }, []);

  // Load based on tab
  useEffect(() => {
    if (activeTab === "pending") loadPendingReviews();
    else if (activeTab === "myResults") loadCycles();
    else if (activeTab === "admin") loadCycles();
  }, [activeTab, loadPendingReviews, loadCycles]);

  // ====== Cycle CRUD ======
  const handleOpenCycleForm = useCallback((cycle = null) => {
    if (cycle) {
      setEditingCycle(cycle);
      setCycleForm({
        perf360CycleName: cycle.perf360CycleName, perf360CycleDescription: cycle.perf360CycleDescription || "",
        perf360CycleYear: String(cycle.perf360CycleYear), perf360CycleQuarter: cycle.perf360CycleQuarter ? String(cycle.perf360CycleQuarter) : "",
        perf360CycleResponseDeadline: cycle.perf360CycleResponseDeadline ? cycle.perf360CycleResponseDeadline.split("T")[0] : "",
        perf360CycleAnonymousToReviewee: cycle.perf360CycleAnonymousToReviewee !== false,
      });
    } else {
      setEditingCycle(null);
      setCycleForm({
        perf360CycleName: "", perf360CycleDescription: "", perf360CycleYear: String(new Date().getFullYear()),
        perf360CycleQuarter: "", perf360CycleResponseDeadline: "", perf360CycleAnonymousToReviewee: true,
      });
    }
    cycleModal.onOpen();
  }, [cycleModal]);

  const handleSaveCycle = useCallback(async () => {
    if (!cycleForm.perf360CycleName.trim() || !cycleForm.perf360CycleResponseDeadline) {
      toast.error("กรุณากรอกชื่อและวันสิ้นสุด");
      return;
    }
    setSavingCycle(true);
    try {
      const payload = {
        name: cycleForm.perf360CycleName,
        description: cycleForm.perf360CycleDescription,
        year: cycleForm.perf360CycleYear,
        quarter: cycleForm.perf360CycleQuarter,
        responseDeadline: cycleForm.perf360CycleResponseDeadline,
        anonymousToReviewee: cycleForm.perf360CycleAnonymousToReviewee,
      };
      if (editingCycle) {
        await updateFeedback360Cycle(editingCycle.perf360CycleId, payload);
        toast.success("อัปเดตรอบประเมินสำเร็จ");
      } else {
        await createFeedback360Cycle(payload);
        toast.success("สร้างรอบประเมินสำเร็จ");
      }
      cycleModal.onClose();
      loadCycles();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingCycle(false);
    }
  }, [editingCycle, cycleForm, cycleModal, loadCycles]);

  const handleDeleteCycle = useCallback(async (perf360CycleId) => {
    try {
      await deleteFeedback360Cycle(perf360CycleId);
      toast.success("ลบรอบประเมินสำเร็จ");
      loadCycles();
      if (selectedCycle?.perf360CycleId === perf360CycleId) setSelectedCycle(null);
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadCycles, selectedCycle]);

  const handleTransition = useCallback(async (perf360CycleId, toStatus) => {
    try {
      await transitionFeedback360Cycle(perf360CycleId, toStatus);
      toast.success("เปลี่ยนสถานะสำเร็จ");
      loadCycles();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadCycles]);

  // ====== Competencies ======
  const loadCompetencies = useCallback(async (perf360CycleId) => {
    setLoadingCompetencies(true);
    try {
      const data = await getFeedback360Competencies(perf360CycleId);
      setCompetencies(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดสมรรถนะได้");
    } finally {
      setLoadingCompetencies(false);
    }
  }, []);

  const handleSaveCompetencies = useCallback(async (perf360CycleId, comps) => {
    setSavingCompetencies(true);
    try {
      await saveFeedback360Competencies(perf360CycleId, comps);
      toast.success("บันทึกสมรรถนะสำเร็จ");
      loadCompetencies(perf360CycleId);
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingCompetencies(false);
    }
  }, [loadCompetencies]);

  const handleLoadTemplates = useCallback((perf360CycleId) => {
    setCompetencies(DEFAULT_COMPETENCY_TEMPLATES.map((t, i) => ({
      ...t, perf360CompetencyId: `template-${i}`, perf360CompetencySortOrder: i, perf360CompetencyWeight: 1, perf360CompetencyQuestions: t.questions,
    })));
  }, []);

  // ====== Nominations ======
  const loadNominations = useCallback(async (perf360CycleId) => {
    setLoadingNominations(true);
    try {
      const data = await getFeedback360Nominations(perf360CycleId);
      setNominations(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดรายชื่อผู้ประเมินได้");
    } finally {
      setLoadingNominations(false);
    }
  }, []);

  const handleOpenNominationForm = useCallback(() => {
    setNominationForm({ perf360NominationRevieweeEmployeeId: "", perf360NominationReviewerEmployeeId: "", perf360NominationRelationshipType: "peer" });
    nominationModal.onOpen();
  }, [nominationModal]);

  const handleSaveNomination = useCallback(async () => {
    if (!nominationForm.perf360NominationRevieweeEmployeeId || !nominationForm.perf360NominationReviewerEmployeeId) {
      toast.error("กรุณาเลือกผู้ถูกประเมินและผู้ประเมิน");
      return;
    }
    setSavingNomination(true);
    try {
      await createFeedback360Nomination({
        cycleId: selectedCycle.perf360CycleId,
        revieweeEmployeeId: nominationForm.perf360NominationRevieweeEmployeeId,
        reviewerEmployeeId: nominationForm.perf360NominationReviewerEmployeeId,
        relationshipType: nominationForm.perf360NominationRelationshipType,
      });
      toast.success("เพิ่มผู้ประเมินสำเร็จ");
      nominationModal.onClose();
      loadNominations(selectedCycle.perf360CycleId);
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingNomination(false);
    }
  }, [nominationForm, selectedCycle, nominationModal, loadNominations]);

  const handleDeleteNomination = useCallback(async (perf360NominationId) => {
    try {
      await deleteFeedback360Nomination(perf360NominationId);
      toast.success("ลบผู้ประเมินสำเร็จ");
      if (selectedCycle) loadNominations(selectedCycle.perf360CycleId);
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [selectedCycle, loadNominations]);

  // ====== Review ======
  const handleOpenReview = useCallback(async (nomination) => {
    setActiveReview(nomination);
    setReviewComments({ perf360ResponseStrengthComment: "", perf360ResponseImprovementComment: "", perf360ResponseComment: "" });

    // Load competencies for the cycle
    try {
      const comps = await getFeedback360Competencies(nomination.perf360NominationCycleId);
      setReviewCompetencies(comps || []);
      // Initialize empty scores
      const initScores = {};
      for (const comp of (comps || [])) {
        initScores[comp.perf360CompetencyId] = Array(comp.perf360CompetencyQuestions.length).fill(0);
      }
      setReviewScores(initScores);
      reviewModal.onOpen();
    } catch {
      toast.error("ไม่สามารถโหลดสมรรถนะได้");
    }
  }, [reviewModal]);

  const setReviewScore = useCallback((perf360CompetencyId, questionIndex, value) => {
    setReviewScores((prev) => {
      const updated = { ...prev };
      updated[perf360CompetencyId] = [...(prev[perf360CompetencyId] || [])];
      updated[perf360CompetencyId][questionIndex] = value;
      return updated;
    });
  }, []);

  const handleSubmitReview = useCallback(async () => {
    // Validate all questions answered
    for (const comp of reviewCompetencies) {
      const scores = reviewScores[comp.perf360CompetencyId] || [];
      if (scores.some((s) => s === 0)) {
        toast.error(`กรุณากรอกคะแนนครบทุกข้อในหมวด "${comp.perf360CompetencyName}"`);
        return;
      }
    }

    setSubmittingReview(true);
    try {
      await submitFeedback360Response({
        nominationId: activeReview.perf360NominationId,
        scores: reviewScores,
        strengthComment: reviewComments.perf360ResponseStrengthComment,
        improvementComment: reviewComments.perf360ResponseImprovementComment,
        comment: reviewComments.perf360ResponseComment,
      });
      toast.success("ส่งผลประเมินเรียบร้อย");
      reviewModal.onClose();
      loadPendingReviews();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSubmittingReview(false);
    }
  }, [activeReview, reviewScores, reviewComments, reviewCompetencies, reviewModal, loadPendingReviews]);

  // ====== Results ======
  const loadMyResults = useCallback(async (perf360CycleId) => {
    if (!currentEmployee) return;
    setLoadingResults(true);
    try {
      const data = await getFeedback360Results(perf360CycleId, currentEmployee.hrEmployeeId);
      setMyResults(data);
    } catch {
      toast.error("ไม่สามารถโหลดผลประเมินได้");
    } finally {
      setLoadingResults(false);
    }
  }, [currentEmployee]);

  const loadAllResults = useCallback(async (perf360CycleId) => {
    setLoadingResults(true);
    try {
      const data = await getFeedback360Results(perf360CycleId);
      setAllResults(data);
    } catch {
      toast.error("ไม่สามารถโหลดผลประเมินได้");
    } finally {
      setLoadingResults(false);
    }
  }, []);

  // Load cycle details when selected
  useEffect(() => {
    if (selectedCycle) {
      loadCompetencies(selectedCycle.perf360CycleId);
      loadNominations(selectedCycle.perf360CycleId);
    }
  }, [selectedCycle, loadCompetencies, loadNominations]);

  return {
    activeTab, setActiveTab,
    employees, currentEmployee, loading,
    // Cycles
    cycles, selectedCycle, setSelectedCycle, loadingCycles, loadCycles,
    cycleModal, editingCycle, cycleForm, setCycleForm,
    savingCycle, handleOpenCycleForm, handleSaveCycle,
    handleDeleteCycle, handleTransition,
    // Competencies
    competencies, setCompetencies, loadingCompetencies,
    savingCompetencies, handleSaveCompetencies, handleLoadTemplates,
    // Nominations
    nominations, loadingNominations,
    nominationModal, nominationForm, setNominationForm,
    savingNomination, handleOpenNominationForm, handleSaveNomination, handleDeleteNomination,
    // Pending
    pendingReviews, loadingPending,
    // Review
    reviewModal, activeReview, reviewCompetencies,
    reviewScores, setReviewScore, reviewComments, setReviewComments,
    submittingReview, handleOpenReview, handleSubmitReview,
    // Results
    myResults, allResults, loadingResults,
    resultCycleId, setResultCycleId,
    loadMyResults, loadAllResults,
  };
}
