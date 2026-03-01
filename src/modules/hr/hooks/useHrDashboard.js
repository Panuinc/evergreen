"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export function useHrDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hr/dashboard");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      toast.error("โหลดข้อมูลแดชบอร์ดล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return { stats, loading };
}
