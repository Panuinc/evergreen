import { get } from "@/lib/apiClient";

export async function getBcProductionOrders() {
  return get("/api/bc/productionOrders");
}

export async function getBcProduction() {
  return get("/api/bc/production");
}

export async function getProductionDashboard(compareMode) {
  const params = compareMode ? `?compareMode=${compareMode}` : "";
  return get(`/api/production/dashboard${params}`);
}

export async function getFrameMaterials() {
  return get("/api/production/frames");
}

export async function getCoreMaterials() {
  return get("/api/production/cores");
}
