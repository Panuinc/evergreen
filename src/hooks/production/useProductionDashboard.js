"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getProductionDashboard } from "@/actions/production";

export function useProductionDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await getProductionDashboard();
        setStats(data);
      } catch {
        toast.error("โหลดข้อมูลแดชบอร์ดการผลิตล้มเหลว");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return { stats, loading };
}
