"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getItDashboardStats } from "@/modules/it/actions";

export function useItDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(null);

  const loadData = useCallback(async (mode) => {
    try {
      setLoading(true);
      const data = await getItDashboardStats(mode);
      setStats(data);
    } catch {
      toast.error("โหลดข้อมูลแดชบอร์ดล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(compareMode);
  }, [compareMode, loadData]);

  return { stats, loading, compareMode, setCompareMode };
}
