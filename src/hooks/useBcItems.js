"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBcItems } from "@/actions/bc";

export function useBcItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getBcItems();
      setItems(data);
    } catch (error) {
      toast.error("โหลดรายการสินค้าจาก Business Central ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return { items, loading };
}
