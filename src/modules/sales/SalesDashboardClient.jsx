"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import DashboardView from "@/modules/sales/components/DashboardView";

export default function DashboardClient({ initialData }) {
  const [data, setData] = useState(initialData);
  const [compareMode, setCompareMode] = useState(null);

  const handleCompareModeChange = useCallback(async (mode) => {
    setCompareMode(mode);
    try {
      const params = mode ? `?compareMode=${mode}` : "";
      const { get } = await import("@/lib/apiClient");
      const result = await get(`/api/sales/dashboard${params}`);
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
