"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import DashboardView from "@/modules/it/components/dashboardView";
import type { ItDashboardClientProps, ItDashboardStats } from "@/modules/it/types";

export default function DashboardClient({ initialStats }: ItDashboardClientProps) {
  const [stats, setStats] = useState<ItDashboardStats | null>(initialStats);
  const [compareMode, setCompareMode] = useState<string | null>(null);

  const handleCompareModeChange = useCallback(async (mode: string | null) => {
    setCompareMode(mode);
    try {
      const params = mode ? `?compareMode=${mode}` : "";
      const { get } = await import("@/lib/apiClient");
      const data = await get<ItDashboardStats>(`/api/it/dashboard${params}`);
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
