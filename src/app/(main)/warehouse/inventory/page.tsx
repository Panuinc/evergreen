import { api } from "@/lib/api.server";
import InventoryClient from "@/modules/warehouse/inventoryClient";
import type { BcItem } from "@/modules/warehouse/types";

export default async function WarehouseInventoryPage() {
  const items = await api<BcItem[]>("/api/warehouse/inventory");

  return <InventoryClient initialItems={items || []} />;
}
