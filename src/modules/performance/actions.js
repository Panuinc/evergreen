import { get, post, put, del } from "@/lib/apiClient";



export async function submitEvaluation(data) {
  return post("/api/performance/evaluation", data);
}

export async function getMyEvaluations(perfEvaluationPeriod) {
  const params = new URLSearchParams({ myResults: "true" });
  if (perfEvaluationPeriod) params.set("period", perfEvaluationPeriod);
  return get(`/api/performance/evaluation?${params}`);
}

export async function getMySubmittedEvaluations(perfEvaluationPeriod) {
  const params = new URLSearchParams();
  if (perfEvaluationPeriod) params.set("period", perfEvaluationPeriod);
  return get(`/api/performance/evaluation?${params}`);
}

export async function getEvaluationSummary(params) {
  return get(`/api/performance/evaluation/summary?${new URLSearchParams(params)}`);
}



export async function getEvaluationFeedback(perfEvaluationEmployeeId, perfEvaluationPeriod) {
  return get(`/api/performance/evaluation/feedback?employeeId=${perfEvaluationEmployeeId}&period=${perfEvaluationPeriod}`);
}

export async function generateEvaluationFeedbackAction(perfEvaluationEmployeeId, perfEvaluationPeriod) {
  return post("/api/performance/evaluation/feedback", { employeeId: perfEvaluationEmployeeId, period: perfEvaluationPeriod });
}



export async function getObjectives(params = {}) {
  const qs = new URLSearchParams(params);
  return get(`/api/performance/okr?${qs}`);
}

export async function createObjective(data) {
  return post("/api/performance/okr", data);
}

export async function updateObjective(perfOkrObjectiveId, data) {
  return put(`/api/performance/okr/${perfOkrObjectiveId}`, data);
}

export async function deleteObjective(perfOkrObjectiveId) {
  return del(`/api/performance/okr/${perfOkrObjectiveId}`);
}

export async function createKeyResult(data) {
  return post("/api/performance/okr/key-results", data);
}

export async function updateKeyResult(perfOkrKeyResultId, data) {
  return put(`/api/performance/okr/key-results/${perfOkrKeyResultId}`, data);
}

export async function deleteKeyResult(perfOkrKeyResultId) {
  return del(`/api/performance/okr/key-results/${perfOkrKeyResultId}`);
}

export async function getCheckins(perfOkrKeyResultId) {
  return get(`/api/performance/okr/checkins?keyResultId=${perfOkrKeyResultId}`);
}

export async function createCheckin(data) {
  return post("/api/performance/okr/checkins", data);
}



export async function getKpiDefinitions(params = {}) {
  const qs = new URLSearchParams(params);
  return get(`/api/performance/kpi/definitions?${qs}`);
}

export async function createKpiDefinition(data) {
  return post("/api/performance/kpi/definitions", data);
}

export async function updateKpiDefinition(perfKpiDefinitionId, data) {
  return put(`/api/performance/kpi/definitions/${perfKpiDefinitionId}`, data);
}

export async function deleteKpiDefinition(perfKpiDefinitionId) {
  return del(`/api/performance/kpi/definitions/${perfKpiDefinitionId}`);
}

export async function getKpiAssignments(params = {}) {
  const qs = new URLSearchParams(params);
  return get(`/api/performance/kpi/assignments?${qs}`);
}

export async function createKpiAssignment(data) {
  return post("/api/performance/kpi/assignments", data);
}

export async function updateKpiAssignment(perfKpiAssignmentId, data) {
  return put(`/api/performance/kpi/assignments/${perfKpiAssignmentId}`, data);
}

export async function deleteKpiAssignment(perfKpiAssignmentId) {
  return del(`/api/performance/kpi/assignments/${perfKpiAssignmentId}`);
}

export async function getKpiRecords(perfKpiAssignmentId) {
  return get(`/api/performance/kpi/records?assignmentId=${perfKpiAssignmentId}`);
}

export async function recordKpiValue(data) {
  return post("/api/performance/kpi/records", data);
}

export async function getKpiDashboard(params = {}) {
  const qs = new URLSearchParams(params);
  return get(`/api/performance/kpi/dashboard?${qs}`);
}



export async function getFeedback360Cycles(params = {}) {
  const qs = new URLSearchParams(params);
  return get(`/api/performance/360/cycles?${qs}`);
}

export async function createFeedback360Cycle(data) {
  return post("/api/performance/360/cycles", data);
}

export async function updateFeedback360Cycle(perf360CycleId, data) {
  return put(`/api/performance/360/cycles/${perf360CycleId}`, data);
}

export async function deleteFeedback360Cycle(perf360CycleId) {
  return del(`/api/performance/360/cycles/${perf360CycleId}`);
}

export async function transitionFeedback360Cycle(perf360CycleId, toStatus) {
  return post(`/api/performance/360/cycles/${perf360CycleId}/transition`, { toStatus });
}

export async function getFeedback360Competencies(perf360CycleId) {
  return get(`/api/performance/360/competencies?cycleId=${perf360CycleId}`);
}

export async function saveFeedback360Competencies(perf360CycleId, competencies) {
  return post("/api/performance/360/competencies", { cycleId: perf360CycleId, competencies });
}

export async function getFeedback360Nominations(perf360CycleId) {
  return get(`/api/performance/360/nominations?cycleId=${perf360CycleId}`);
}

export async function createFeedback360Nomination(data) {
  return post("/api/performance/360/nominations", data);
}

export async function deleteFeedback360Nomination(perf360NominationId) {
  return del(`/api/performance/360/nominations?id=${perf360NominationId}`);
}

export async function getMyPendingFeedback360Reviews() {
  return get("/api/performance/360/responses?pending=true");
}

export async function submitFeedback360Response(data) {
  return post("/api/performance/360/responses", data);
}

export async function getFeedback360Results(perf360CycleId, perfEvaluationEmployeeId) {
  const qs = new URLSearchParams({ cycleId: perf360CycleId });
  if (perfEvaluationEmployeeId) qs.set("employeeId", perfEvaluationEmployeeId);
  return get(`/api/performance/360/results?${qs}`);
}
