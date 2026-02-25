"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBcProductionOrders } from "@/actions/production";

export function useProductionOrders() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getBcProductionOrders();
      setData(result);
    } catch (error) {
      toast.error("โหลดข้อมูลใบสั่งผลิตล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, reload: loadData };
}
