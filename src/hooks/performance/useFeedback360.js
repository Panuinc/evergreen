"use client";

import { useState, useEffect, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getEmployees } from "@/actions/hr";
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
} from "@/actions/performance";
import { DEFAULT_COMPETENCY_TEMPLATES } from "@/lib/performance/feedback360Constants";

export function useFeedback360() {
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
    name: "", description: "", year: String(new Date().getFullYear()),
    quarter: "", responseDeadline: "", anonymousToReviewee: true,
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
    revieweeEmployeeId: "", reviewerEmployeeId: "", relationshipType: "peer",
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
    strengthComment: "", improvementComment: "", comment: "",
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
        const myEmp = (data || []).find((e) => e.employeeUserId === user.id);
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
        name: cycle.name, description: cycle.description || "",
        year: String(cycle.year), quarter: cycle.quarter ? String(cycle.quarter) : "",
        responseDeadline: cycle.responseDeadline ? cycle.responseDeadline.split("T")[0] : "",
        anonymousToReviewee: cycle.anonymousToReviewee !== false,
      });
    } else {
      setEditingCycle(null);
      setCycleForm({
        name: "", description: "", year: String(new Date().getFullYear()),
        quarter: "", responseDeadline: "", anonymousToReviewee: true,
      });
    }
    cycleModal.onOpen();
  }, [cycleModal]);

  const handleSaveCycle = useCallback(async () => {
    if (!cycleForm.name.trim() || !cycleForm.responseDeadline) {
      toast.error("กรุณากรอกชื่อและวันสิ้นสุด");
      return;
    }
    setSavingCycle(true);
    try {
      if (editingCycle) {
        await updateFeedback360Cycle(editingCycle.id, cycleForm);
        toast.success("อัปเดตรอบประเมินสำเร็จ");
      } else {
        await createFeedback360Cycle(cycleForm);
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

  const handleDeleteCycle = useCallback(async (id) => {
    try {
      await deleteFeedback360Cycle(id);
      toast.success("ลบรอบประเมินสำเร็จ");
      loadCycles();
      if (selectedCycle?.id === id) setSelectedCycle(null);
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadCycles, selectedCycle]);

  const handleTransition = useCallback(async (cycleId, toStatus) => {
    try {
      await transitionFeedback360Cycle(cycleId, toStatus);
      toast.success("เปลี่ยนสถานะสำเร็จ");
      loadCycles();
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [loadCycles]);

  // ====== Competencies ======
  const loadCompetencies = useCallback(async (cycleId) => {
    setLoadingCompetencies(true);
    try {
      const data = await getFeedback360Competencies(cycleId);
      setCompetencies(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดสมรรถนะได้");
    } finally {
      setLoadingCompetencies(false);
    }
  }, []);

  const handleSaveCompetencies = useCallback(async (cycleId, comps) => {
    setSavingCompetencies(true);
    try {
      await saveFeedback360Competencies(cycleId, comps);
      toast.success("บันทึกสมรรถนะสำเร็จ");
      loadCompetencies(cycleId);
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingCompetencies(false);
    }
  }, [loadCompetencies]);

  const handleLoadTemplates = useCallback((cycleId) => {
    setCompetencies(DEFAULT_COMPETENCY_TEMPLATES.map((t, i) => ({
      ...t, id: `template-${i}`, sortOrder: i, weight: 1, questions: t.questions,
    })));
  }, []);

  // ====== Nominations ======
  const loadNominations = useCallback(async (cycleId) => {
    setLoadingNominations(true);
    try {
      const data = await getFeedback360Nominations(cycleId);
      setNominations(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดรายชื่อผู้ประเมินได้");
    } finally {
      setLoadingNominations(false);
    }
  }, []);

  const handleOpenNominationForm = useCallback(() => {
    setNominationForm({ revieweeEmployeeId: "", reviewerEmployeeId: "", relationshipType: "peer" });
    nominationModal.onOpen();
  }, [nominationModal]);

  const handleSaveNomination = useCallback(async () => {
    if (!nominationForm.revieweeEmployeeId || !nominationForm.reviewerEmployeeId) {
      toast.error("กรุณาเลือกผู้ถูกประเมินและผู้ประเมิน");
      return;
    }
    setSavingNomination(true);
    try {
      await createFeedback360Nomination({
        cycleId: selectedCycle.id,
        ...nominationForm,
      });
      toast.success("เพิ่มผู้ประเมินสำเร็จ");
      nominationModal.onClose();
      loadNominations(selectedCycle.id);
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setSavingNomination(false);
    }
  }, [nominationForm, selectedCycle, nominationModal, loadNominations]);

  const handleDeleteNomination = useCallback(async (id) => {
    try {
      await deleteFeedback360Nomination(id);
      toast.success("ลบผู้ประเมินสำเร็จ");
      if (selectedCycle) loadNominations(selectedCycle.id);
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  }, [selectedCycle, loadNominations]);

  // ====== Review ======
  const handleOpenReview = useCallback(async (nomination) => {
    setActiveReview(nomination);
    setReviewComments({ strengthComment: "", improvementComment: "", comment: "" });

    // Load competencies for the cycle
    try {
      const comps = await getFeedback360Competencies(nomination.cycleId);
      setReviewCompetencies(comps || []);
      // Initialize empty scores
      const initScores = {};
      for (const comp of (comps || [])) {
        initScores[comp.id] = Array(comp.questions.length).fill(0);
      }
      setReviewScores(initScores);
      reviewModal.onOpen();
    } catch {
      toast.error("ไม่สามารถโหลดสมรรถนะได้");
    }
  }, [reviewModal]);

  const setReviewScore = useCallback((competencyId, questionIndex, value) => {
    setReviewScores((prev) => {
      const updated = { ...prev };
      updated[competencyId] = [...(prev[competencyId] || [])];
      updated[competencyId][questionIndex] = value;
      return updated;
    });
  }, []);

  const handleSubmitReview = useCallback(async () => {
    // Validate all questions answered
    for (const comp of reviewCompetencies) {
      const scores = reviewScores[comp.id] || [];
      if (scores.some((s) => s === 0)) {
        toast.error(`กรุณากรอกคะแนนครบทุกข้อในหมวด "${comp.name}"`);
        return;
      }
    }

    setSubmittingReview(true);
    try {
      await submitFeedback360Response({
        nominationId: activeReview.id,
        scores: reviewScores,
        ...reviewComments,
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
  const loadMyResults = useCallback(async (cycleId) => {
    if (!currentEmployee) return;
    setLoadingResults(true);
    try {
      const data = await getFeedback360Results(cycleId, currentEmployee.employeeId);
      setMyResults(data);
    } catch {
      toast.error("ไม่สามารถโหลดผลประเมินได้");
    } finally {
      setLoadingResults(false);
    }
  }, [currentEmployee]);

  const loadAllResults = useCallback(async (cycleId) => {
    setLoadingResults(true);
    try {
      const data = await getFeedback360Results(cycleId);
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
      loadCompetencies(selectedCycle.id);
      loadNominations(selectedCycle.id);
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
