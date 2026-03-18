"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { get } from "@/lib/apiClient";

export function useWarehouseInventory(group) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  const loadItems = async () => {
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

  return { items, loading, reload: loadItems };
}
