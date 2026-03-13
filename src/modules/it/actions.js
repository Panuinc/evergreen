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
