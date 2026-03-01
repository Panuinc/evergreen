"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getStockItems } from "@/modules/marketing/actions";

export function useOmStockItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({});

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getStockItems();
      setItems(data);
      const initial = {};
      for (const item of data) {
        if (item.customPrice != null) {
          initial[item.number] = item.customPrice;
        }
      }
      setPrices(initial);
    } catch (error) {
      toast.error("โหลดรายการสินค้าล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = (number, value) => {
    setPrices((prev) => ({ ...prev, [number]: value }));
  };

  return { items, loading, prices, updatePrice };
}
