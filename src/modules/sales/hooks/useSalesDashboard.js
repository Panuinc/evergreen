"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getSalesDashboard } from "@/modules/sales/actions";

export function useSalesDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getSalesDashboard();
      setData(result);
    } catch (error) {
      toast.error("โหลดแดชบอร์ดล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    reload: loadData,
  };
}
