import { get } from "@/lib/apiClient";

export async function getProductionDashboard() {
  return get("/api/production/dashboard");
}

export async function getProductionOrders() {
  return get("/api/production/orders");
}
