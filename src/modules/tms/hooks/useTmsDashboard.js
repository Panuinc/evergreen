"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getDashboardStats } from "@/modules/tms/actions";

export function useTmsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch {
        toast.error("โหลดข้อมูลแดชบอร์ดล้มเหลว");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return { stats, loading };
}
