"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import DashboardView from "@/modules/sales/components/dashboardView";
import type {
  DashboardClientProps,
  SalesDashboardData,
  SalesDashboardCompareData,
} from "@/modules/sales/types";

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [data, setData] = useState<SalesDashboardData | SalesDashboardCompareData | null>(initialData);
  const [compareMode, setCompareModeState] = useState<string | null>(null);

  const handleCompareModeChange = useCallback(async (mode: string | null) => {
    setCompareModeState(mode);
    try {
      const params = mode ? `?compareMode=${mode}` : "";
      const { get } = await import("@/lib/apiClient");
      const result = await get<SalesDashboardData | SalesDashboardCompareData>(`/api/sales/dashboard${params}`);
      setData(result);
    } catch {
      toast.error("โหลดแดชบอร์ดล้มเหลว");
    }
  }, []);

  return (
    <DashboardView
      data={data}
      loading={false}
      compareMode={compareMode}
      setCompareMode={handleCompareModeChange}
    />
  );
}
