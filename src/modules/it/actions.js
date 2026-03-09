import { get, post, put, del } from "@/lib/apiClient";



export async function getAssets() {
  return get("/api/it/assets");
}

export async function createAsset(data) {
  return post("/api/it/assets", data);
}

export async function updateAsset(id, data) {
  return put(`/api/it/assets/${id}`, data);
}

export async function deleteAsset(id) {
  return del(`/api/it/assets/${id}`);
}



export async function getTickets() {
  return get("/api/it/tickets");
}

export async function createTicket(data) {
  return post("/api/it/tickets", data);
}

export async function updateTicket(id, data) {
  return put(`/api/it/tickets/${id}`, data);
}

export async function deleteTicket(id) {
  return del(`/api/it/tickets/${id}`);
}



export async function getSystemAccess() {
  return get("/api/it/systemAccess");
}

export async function createSystemAccess(data) {
  return post("/api/it/systemAccess", data);
}

export async function updateSystemAccess(id, data) {
  return put(`/api/it/systemAccess/${id}`, data);
}

export async function deleteSystemAccess(id) {
  return del(`/api/it/systemAccess/${id}`);
}



export async function getNetworkDevices() {
  return get("/api/it/network");
}

export async function createNetworkDevice(data) {
  return post("/api/it/network", data);
}

export async function updateNetworkDevice(id, data) {
  return put(`/api/it/network/${id}`, data);
}

export async function deleteNetworkDevice(id) {
  return del(`/api/it/network/${id}`);
}



export async function getSoftware() {
  return get("/api/it/software");
}

export async function createSoftware(data) {
  return post("/api/it/software", data);
}

export async function updateSoftware(id, data) {
  return put(`/api/it/software/${id}`, data);
}

export async function deleteSoftware(id) {
  return del(`/api/it/software/${id}`);
}



export async function getSecurityIncidents() {
  return get("/api/it/security");
}

export async function createSecurityIncident(data) {
  return post("/api/it/security", data);
}

export async function updateSecurityIncident(id, data) {
  return put(`/api/it/security/${id}`, data);
}

export async function deleteSecurityIncident(id) {
  return del(`/api/it/security/${id}`);
}



export async function getDevRequests() {
  return get("/api/it/devRequests");
}

export async function createDevRequest(data) {
  return post("/api/it/devRequests", data);
}

export async function updateDevRequest(id, data) {
  return put(`/api/it/devRequests/${id}`, data);
}

export async function deleteDevRequest(id) {
  return del(`/api/it/devRequests/${id}`);
}



export async function getProgressLogs(requestId) {
  return get(`/api/it/devRequests/${requestId}/progress`);
}

export async function createProgressLog(requestId, data) {
  return post(`/api/it/devRequests/${requestId}/progress`, data);
}



export async function getItDashboardStats(compareMode) {
  const params = compareMode ? `?compareMode=${compareMode}` : "";
  return get(`/api/it/dashboard${params}`);
}
