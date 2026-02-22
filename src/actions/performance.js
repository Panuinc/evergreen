import { get, post, put, del } from "@/lib/apiClient";

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

// ==================== OKR ====================

export async function getObjectives(params = {}) {
  const qs = new URLSearchParams(params);
  return get(`/api/performance/okr?${qs}`);
}

export async function createObjective(data) {
  return post("/api/performance/okr", data);
}

export async function updateObjective(id, data) {
  return put(`/api/performance/okr/${id}`, data);
}

export async function deleteObjective(id) {
  return del(`/api/performance/okr/${id}`);
}

export async function createKeyResult(data) {
  return post("/api/performance/okr/key-results", data);
}

export async function updateKeyResult(id, data) {
  return put(`/api/performance/okr/key-results/${id}`, data);
}

export async function deleteKeyResult(id) {
  return del(`/api/performance/okr/key-results/${id}`);
}

export async function getCheckins(keyResultId) {
  return get(`/api/performance/okr/checkins?keyResultId=${keyResultId}`);
}

export async function createCheckin(data) {
  return post("/api/performance/okr/checkins", data);
}

// ==================== KPI ====================

export async function getKpiDefinitions(params = {}) {
  const qs = new URLSearchParams(params);
  return get(`/api/performance/kpi/definitions?${qs}`);
}

export async function createKpiDefinition(data) {
  return post("/api/performance/kpi/definitions", data);
}

export async function updateKpiDefinition(id, data) {
  return put(`/api/performance/kpi/definitions/${id}`, data);
}

export async function deleteKpiDefinition(id) {
  return del(`/api/performance/kpi/definitions/${id}`);
}

export async function getKpiAssignments(params = {}) {
  const qs = new URLSearchParams(params);
  return get(`/api/performance/kpi/assignments?${qs}`);
}

export async function createKpiAssignment(data) {
  return post("/api/performance/kpi/assignments", data);
}

export async function updateKpiAssignment(id, data) {
  return put(`/api/performance/kpi/assignments/${id}`, data);
}

export async function deleteKpiAssignment(id) {
  return del(`/api/performance/kpi/assignments/${id}`);
}

export async function getKpiRecords(assignmentId) {
  return get(`/api/performance/kpi/records?assignmentId=${assignmentId}`);
}

export async function recordKpiValue(data) {
  return post("/api/performance/kpi/records", data);
}

export async function getKpiDashboard(params = {}) {
  const qs = new URLSearchParams(params);
  return get(`/api/performance/kpi/dashboard?${qs}`);
}

// ==================== 360 Feedback ====================

export async function getFeedback360Cycles(params = {}) {
  const qs = new URLSearchParams(params);
  return get(`/api/performance/360/cycles?${qs}`);
}

export async function createFeedback360Cycle(data) {
  return post("/api/performance/360/cycles", data);
}

export async function updateFeedback360Cycle(id, data) {
  return put(`/api/performance/360/cycles/${id}`, data);
}

export async function deleteFeedback360Cycle(id) {
  return del(`/api/performance/360/cycles/${id}`);
}

export async function transitionFeedback360Cycle(id, toStatus) {
  return post(`/api/performance/360/cycles/${id}/transition`, { toStatus });
}

export async function getFeedback360Competencies(cycleId) {
  return get(`/api/performance/360/competencies?cycleId=${cycleId}`);
}

export async function saveFeedback360Competencies(cycleId, competencies) {
  return post("/api/performance/360/competencies", { cycleId, competencies });
}

export async function getFeedback360Nominations(cycleId) {
  return get(`/api/performance/360/nominations?cycleId=${cycleId}`);
}

export async function createFeedback360Nomination(data) {
  return post("/api/performance/360/nominations", data);
}

export async function deleteFeedback360Nomination(id) {
  return del(`/api/performance/360/nominations?id=${id}`);
}

export async function getMyPendingFeedback360Reviews() {
  return get("/api/performance/360/responses?pending=true");
}

export async function submitFeedback360Response(data) {
  return post("/api/performance/360/responses", data);
}

export async function getFeedback360Results(cycleId, employeeId) {
  const qs = new URLSearchParams({ cycleId });
  if (employeeId) qs.set("employeeId", employeeId);
  return get(`/api/performance/360/results?${qs}`);
}
