import { get } from "@/lib/apiClient";

export async function getBcCustomers() {
  return get("/api/bc/customers");
}

export async function getBcItems() {
  return get("/api/bc/items");
}

export async function getBcSalesOrders() {
  return get("/api/bc/salesOrders");
}
