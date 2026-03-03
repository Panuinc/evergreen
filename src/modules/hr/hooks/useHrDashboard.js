"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

export function useHrDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(null); // null | "ytm" | "yty"

  const loadData = useCallback(async (mode) => {
    try {
      setLoading(true);
      const params = mode ? `?compareMode=${mode}` : "";
      const res = await fetch(`/api/hr/dashboard${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
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
