"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import DashboardView from "@/modules/production/components/dashboardView";
import type { DashboardClientProps, DashboardResponse, DashboardCompareResponse } from "@/modules/production/types";

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [data, setData] = useState<DashboardResponse | DashboardCompareResponse | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [compareMode, setCompareModeState] = useState<string | null>(null);

  const loadData = useCallback(async (mode: string | null) => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const params = mode ? `?compareMode=${mode}` : "";
      const result = await get<DashboardResponse | DashboardCompareResponse>(`/api/production/dashboard${params}`);
      setData(result);
    } catch {
      toast.error("โหลดข้อมูลแดชบอร์ดการผลิตล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  const setCompareMode = useCallback((mode: string | null) => {
    setCompareModeState(mode);
    loadData(mode);
  }, [loadData]);

  return <DashboardView data={data} loading={loading} compareMode={compareMode} setCompareMode={setCompareMode} />;
}
