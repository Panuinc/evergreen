"use client";

import { useParams } from "next/navigation";
import { useWarehouseInventory } from "@/hooks/warehouse/useWarehouseInventory";
import WarehouseInventoryGroupView from "@/components/warehouse/WarehouseInventoryGroupView";

export default function WarehouseGroupPage() {
  const { group } = useParams();
  const decodedGroup = decodeURIComponent(group);
  const { items, loading } = useWarehouseInventory(decodedGroup);

  return <WarehouseInventoryGroupView items={items} loading={loading} />;
}
