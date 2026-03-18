"use client";

import { useParams } from "next/navigation";
import { useWarehouseInventory } from "@/modules/warehouse/useWarehouseInventory";
import WarehouseInventoryGroupView from "@/modules/warehouse/components/WarehouseInventoryGroupView";

export default function WarehouseGroupPage() {
  const { group } = useParams();
  const decodedGroup = decodeURIComponent(group);
  const { items, loading } = useWarehouseInventory(decodedGroup);

  return <WarehouseInventoryGroupView items={items} loading={loading} />;
}
