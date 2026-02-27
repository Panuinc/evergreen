import { get } from "@/lib/apiClient";

export async function getBcProductionOrders() {
  return get("/api/bc/productionOrders");
}

export async function getBcProduction() {
  return get("/api/bc/production");
}

export async function getProductionDashboard() {
  return get("/api/production/dashboard");
}

export async function getFrameMaterials() {
  return get("/api/production/frames");
}
