import { get, post } from "@/lib/apiClient";

// ==================== Evaluation ====================

export async function submitEvaluation(data) {
  return post("/api/performance/evaluation", data);
}

export async function getMyEvaluations(period) {
  const params = new URLSearchParams({ myResults: "true" });
  if (period) params.set("period", period);
  return get(`/api/performance/evaluation?${params}`);
}

export async function getMySubmittedEvaluations(period) {
  const params = new URLSearchParams();
  if (period) params.set("period", period);
  return get(`/api/performance/evaluation?${params}`);
}

export async function getEvaluationSummary(params) {
  return get(`/api/performance/evaluation/summary?${new URLSearchParams(params)}`);
}

// ==================== Evaluation AI Feedback ====================

export async function getEvaluationFeedback(employeeId, period) {
  return get(`/api/performance/evaluation/feedback?employeeId=${employeeId}&period=${period}`);
}

export async function generateEvaluationFeedbackAction(employeeId, period) {
  return post("/api/performance/evaluation/feedback", { employeeId, period });
}
