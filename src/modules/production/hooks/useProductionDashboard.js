"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getProductionDashboard } from "@/modules/production/actions";

export function useProductionDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(null); // null | "ytm" | "yty"

  const loadData = useCallback(async (mode) => {
    try {
      setLoading(true);
      const result = await getProductionDashboard(mode);
      setData(result);
    } catch (error) {
      toast.error("โหลดข้อมูลแดชบอร์ดการผลิตล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(compareMode);
  }, [compareMode, loadData]);

  return { data, loading, reload: () => loadData(compareMode), compareMode, setCompareMode };
}
