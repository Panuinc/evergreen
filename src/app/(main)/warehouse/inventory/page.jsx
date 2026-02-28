"use client";

import { useWarehouseInventory } from "@/modules/warehouse/hooks/useWarehouseInventory";
import WarehouseInventoryView from "@/modules/warehouse/components/WarehouseInventoryView";

export default function WarehouseInventoryPage() {
  const { items, loading } = useWarehouseInventory();

  return <WarehouseInventoryView items={items} loading={loading} />;
}
