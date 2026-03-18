"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import DashboardView from "@/modules/it/components/DashboardView";

export default function DashboardClient({ initialStats }) {
  const [stats, setStats] = useState(initialStats);
  const [compareMode, setCompareMode] = useState(null);

  const handleCompareModeChange = useCallback(async (mode) => {
    setCompareMode(mode);
    try {
      const params = mode ? `?compareMode=${mode}` : "";
      const { get } = await import("@/lib/apiClient");
      const data = await get(`/api/it/dashboard${params}`);
      setStats(data);
    } catch {
      toast.error("โหลดข้อมูลแดชบอร์ดล้มเหลว");
    }
  }, []);

  return (
    <DashboardView
      stats={stats}
      loading={false}
      compareMode={compareMode}
      setCompareMode={handleCompareModeChange}
    />
  );
}
