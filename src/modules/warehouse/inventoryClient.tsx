"use client";

import { useState } from "react";
import { toast } from "sonner";
import { get } from "@/lib/apiClient";
import WarehouseInventoryView from "@/modules/warehouse/components/warehouseInventoryView";
import type { BcItem, InventoryClientProps } from "@/modules/warehouse/types";

export default function InventoryClient({ initialItems }: InventoryClientProps) {
  const [items, setItems] = useState<BcItem[]>(initialItems);
  const [loading, setLoading] = useState(false);

  const reload = async (group?: string) => {
    try {
      setLoading(true);
      const params = group ? `?group=${encodeURIComponent(group)}` : "";
      const data = await get<BcItem[]>(`/api/warehouse/inventory${params}`);
      setItems(data);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลคลังสินค้าได้");
    } finally {
      setLoading(false);
    }
  };

  return <WarehouseInventoryView items={items} loading={loading} />;
}
