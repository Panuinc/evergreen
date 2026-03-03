"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getDashboardStats } from "@/modules/tms/actions";

export function useTmsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(null); // null | "ytm" | "yty"

  const loadStats = useCallback(async (mode) => {
    try {
      setLoading(true);
      const data = await getDashboardStats(mode);
      setStats(data);
    } catch {
      toast.error("โหลดข้อมูลแดชบอร์ดล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(compareMode);
  }, [compareMode, loadStats]);

  return { stats, loading, compareMode, setCompareMode };
}
