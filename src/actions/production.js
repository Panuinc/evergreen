import { get } from "@/lib/apiClient";

export async function getProductionDashboard() {
  return get("/api/production/dashboard");
}
