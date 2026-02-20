import { get } from "@/lib/apiClient";

export async function getWarehouseInventory() {
  return get("/api/warehouse/inventory");
}
