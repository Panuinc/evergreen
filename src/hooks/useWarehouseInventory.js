"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getWarehouseInventory } from "@/actions/warehouse";

export function useWarehouseInventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getWarehouseInventory();
      setItems(data);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลคลังสินค้าได้");
    } finally {
      setLoading(false);
    }
  };

  return { items, loading, reload: loadItems };
}
