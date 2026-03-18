"use client";

import { useState } from "react";
import { toast } from "sonner";
import { get } from "@/lib/apiClient";
import WarehouseInventoryView from "@/modules/warehouse/components/WarehouseInventoryView";

export default function InventoryClient({ initialItems }) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);

  const reload = async (group) => {
    try {
      setLoading(true);
      const params = group ? `?group=${encodeURIComponent(group)}` : "";
      const data = await get(`/api/warehouse/inventory${params}`);
      setItems(data);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลคลังสินค้าได้");
    } finally {
      setLoading(false);
    }
  };

  return <WarehouseInventoryView items={items} loading={loading} />;
}
