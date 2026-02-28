"use client";

import { useWarehouseInventory } from "@/hooks/warehouse/useWarehouseInventory";
import WarehouseInventoryView from "@/components/warehouse/WarehouseInventoryView";

export default function WarehouseInventoryPage() {
  const { items, loading } = useWarehouseInventory();

  return <WarehouseInventoryView items={items} loading={loading} />;
}
