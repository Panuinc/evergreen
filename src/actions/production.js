import { get } from "@/lib/apiClient";

export async function getBcProduction() {
  return get("/api/bc/production");
}

export async function getProductionDashboard() {
  return get("/api/production/dashboard");
}
