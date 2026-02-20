import { get } from "@/lib/apiClient";

export async function getWarehouseInventory(group) {
  const params = group ? `?group=${encodeURIComponent(group)}` : "";
  return get(`/api/warehouse/inventory${params}`);
}
