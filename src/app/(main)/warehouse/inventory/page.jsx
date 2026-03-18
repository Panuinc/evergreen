import { api } from "@/lib/api.server";
import InventoryClient from "@/modules/warehouse/InventoryClient";

export default async function WarehouseInventoryPage() {
  const items = await api("/api/warehouse/inventory");

  return <InventoryClient initialItems={items || []} />;
}
