"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { get } from "@/lib/apiClient";

export function useHrDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(null);

  const loadData = useCallback(async (mode) => {
    try {
      setLoading(true);
      const params = mode ? `?compareMode=${mode}` : "";
      const data = await get(`/api/hr/dashboard${params}`);
      setStats(data);
    } catch (error) {
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
