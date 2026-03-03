"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getSalesDashboard } from "@/modules/sales/actions";

export function useSalesDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(null); // null | "ytm" | "yty"

  const loadData = useCallback(async (mode) => {
    try {
      setLoading(true);
      const result = await getSalesDashboard(mode);
      setData(result);
    } catch (error) {
      toast.error("โหลดแดชบอร์ดล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(compareMode);
  }, [compareMode, loadData]);

  return { data, loading, reload: () => loadData(compareMode), compareMode, setCompareMode };
}
