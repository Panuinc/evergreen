"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getItDashboardStats } from "@/actions/it";

export function useItDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await getItDashboardStats();
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
