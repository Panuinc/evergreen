"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { getEmployees } from "@/actions/hr";
import {
  submitEvaluation,
  getMyEvaluations,
  getMySubmittedEvaluations,
  getEvaluationSummary,
  getEvaluationFeedback,
  generateEvaluationFeedbackAction,
} from "@/actions/performance";
import {
  EVALUATION_CATEGORIES,
  TOTAL_QUESTIONS,
  computeCategoryAverages,
  computeOverallScore,
  computeGrade,
  createEmptyScores,
} from "@/lib/performance/evaluationCriteria";
import { useAuth } from "@/contexts/AuthContext";

export function useEvaluation() {
  const { user } = useAuth();

  // Form state
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [quarter, setQuarter] = useState(String(Math.ceil((new Date().getMonth() + 1) / 3)));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [scores, setScores] = useState(createEmptyScores());
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Results state
  const [myResults, setMyResults] = useState([]);
  const [companyAverage, setCompanyAverage] = useState(null);
  const [mySubmitted, setMySubmitted] = useState([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // Admin summary
  const [adminSummary, setAdminSummary] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // AI Feedback
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackStale, setFeedbackStale] = useState(false);

  // Current user's employee info
  const [currentEmployee, setCurrentEmployee] = useState(null);

  // Tab
  const [activeTab, setActiveTab] = useState("evaluate");

  // Selected period for results view
  const [resultYear, setResultYear] = useState(String(new Date().getFullYear()));

  // Load employees on mount
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      setEmployees(data || []);

      // Find current user's employee record
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

  // Computed values
  const categoryAverages = useMemo(() => computeCategoryAverages(scores), [scores]);

  const overallScore = useMemo(
    () => computeOverallScore(categoryAverages),
    [categoryAverages],
  );

  const grade = useMemo(() => computeGrade(overallScore), [overallScore]);

  const answeredCount = useMemo(() => {
    let count = 0;
    for (const cat of EVALUATION_CATEGORIES) {
      const catScores = scores[cat.key] || [];
      count += catScores.filter((s) => s > 0).length;
    }
    return count;
  }, [scores]);

  const progress = useMemo(
    () => Math.round((answeredCount / TOTAL_QUESTIONS) * 100),
    [answeredCount],
  );

  const perfEvaluationPeriod = useMemo(() => `Q${quarter}-${year}`, [quarter, year]);

  // Available employees for evaluation (exclude self)
  const availableEmployees = useMemo(() => {
    if (!currentEmployee) return employees.filter((e) => e.hrEmployeeStatus === "active");
    return employees.filter(
      (e) =>
        e.hrEmployeeId !== currentEmployee.hrEmployeeId &&
        e.hrEmployeeStatus === "active",
    );
  }, [employees, currentEmployee]);

  // Set score for a specific question
  const setScore = useCallback((categoryKey, questionIndex, value) => {
    setScores((prev) => {
      const updated = { ...prev };
      updated[categoryKey] = [...(prev[categoryKey] || [])];
      updated[categoryKey][questionIndex] = value;
      return updated;
    });
  }, []);

  // Clear all scores
  const clearScores = useCallback(() => {
    setScores(createEmptyScores());
    setComment("");
  }, []);

  // Submit evaluation
  const handleSubmit = async () => {
    if (!selectedEmployee) {
      toast.error("กรุณาเลือกพนักงานที่ต้องการประเมิน");
      return;
    }

    if (answeredCount < TOTAL_QUESTIONS) {
      toast.error(`กรุณากรอกคะแนนให้ครบทุกข้อ (${answeredCount}/${TOTAL_QUESTIONS})`);
      return;
    }

    setSaving(true);
    try {
      await submitEvaluation({
        evaluateeEmployeeId: selectedEmployee,
        period: perfEvaluationPeriod,
        year: parseInt(year),
        quarter: parseInt(quarter),
        scores,
        comment,
      });
      toast.success("บันทึกผลประเมินเรียบร้อยแล้ว");
      clearScores();
      setSelectedEmployee("");
    } catch (error) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  // Load my results (as evaluatee)
  const loadMyResults = useCallback(async () => {
    if (!currentEmployee) return;
    setLoadingResults(true);
    try {
      const [results, submitted] = await Promise.all([
        getMyEvaluations(),
        getMySubmittedEvaluations(),
      ]);
      setMyResults(results || []);
      setMySubmitted(submitted || []);
    } catch {
      toast.error("ไม่สามารถโหลดผลประเมินได้");
    } finally {
      setLoadingResults(false);
    }
  }, [currentEmployee]);

  // Load company average for a period
  const loadCompanyAverage = useCallback(async (p) => {
    try {
      const data = await getEvaluationSummary({
        companyAverage: "true",
        period: p,
      });
      setCompanyAverage(data);
    } catch {
      // silently fail
    }
  }, []);

  // Load admin summary
  const loadAdminSummary = useCallback(async (p) => {
    setLoadingAdmin(true);
    try {
      const data = await getEvaluationSummary({ period: p });
      setAdminSummary(data || []);
    } catch {
      toast.error("ไม่สามารถโหลดสรุปผลได้");
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  // Load AI feedback
  const loadAiFeedback = useCallback(async (perfEvaluationEmployeeId, feedbackPeriod, forceRegenerate = false) => {
    setLoadingFeedback(true);
    try {
      if (!forceRegenerate) {
        const cached = await getEvaluationFeedback(perfEvaluationEmployeeId, feedbackPeriod);
        if (cached?.feedback && !cached.isStale) {
          setAiFeedback(cached.feedback);
          setFeedbackStale(false);
          setLoadingFeedback(false);
          return;
        }
        if (cached?.isStale) setFeedbackStale(true);
      }
      const result = await generateEvaluationFeedbackAction(perfEvaluationEmployeeId, feedbackPeriod);
      setAiFeedback(result.feedback);
      setFeedbackStale(false);
    } catch {
      toast.error("ไม่สามารถสร้าง AI Feedback ได้");
    } finally {
      setLoadingFeedback(false);
    }
  }, []);

  const clearAiFeedback = useCallback(() => {
    setAiFeedback(null);
    setFeedbackStale(false);
  }, []);

  // Load results when switching to results tab
  useEffect(() => {
    if (activeTab === "myResults") {
      loadMyResults();
    }
  }, [activeTab, loadMyResults]);

  return {
    // Form
    employees: availableEmployees,
    allEmployees: employees,
    selectedEmployee,
    setSelectedEmployee,
    quarter,
    setQuarter,
    year,
    setYear,
    perfEvaluationPeriod,
    scores,
    setScore,
    comment,
    setComment,
    saving,
    loading,
    handleSubmit,
    clearScores,
    currentEmployee,

    // Computed
    categoryAverages,
    overallScore,
    grade,
    answeredCount,
    totalQuestions: TOTAL_QUESTIONS,
    progress,

    // Results
    myResults,
    companyAverage,
    mySubmitted,
    loadingResults,
    loadMyResults,
    loadCompanyAverage,
    resultYear,
    setResultYear,

    // Admin
    adminSummary,
    loadingAdmin,
    loadAdminSummary,

    // AI Feedback
    aiFeedback,
    loadingFeedback,
    feedbackStale,
    loadAiFeedback,
    clearAiFeedback,

    // Tab
    activeTab,
    setActiveTab,
  };
}
