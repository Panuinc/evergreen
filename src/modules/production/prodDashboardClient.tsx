"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import DashboardView from "@/modules/production/components/dashboardView";

export default function DashboardClient({ initialData }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [compareMode, setCompareModeState] = useState(null);

  const loadData = useCallback(async (mode) => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const params = mode ? `?compareMode=${mode}` : "";
      const result = await get(`/api/production/dashboard${params}`);
      setData(result);
    } catch (error) {
      toast.error("โหลดข้อมูลแดชบอร์ดการผลิตล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  const setCompareMode = useCallback((mode) => {
    setCompareModeState(mode);
    loadData(mode);
  }, [loadData]);

  return <DashboardView data={data} loading={loading} compareMode={compareMode} setCompareMode={setCompareMode} />;
}
