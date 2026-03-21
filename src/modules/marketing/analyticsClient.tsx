"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { get } from "@/lib/apiClient";
import AnalyticsView from "@/modules/marketing/components/analyticsView";
import type { AnalyticsClientProps, MktAnalyticsStats } from "@/modules/marketing/types";

const fetcher = (url: string) => get<{ stats: MktAnalyticsStats }>(url);

export default function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const [period, setPeriodState] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const swrKey = period !== "all" && period !== "custom"
    ? `/api/marketing/analytics?period=${period}`
    : null;

  const { data: swrData, isLoading: loading, mutate } = useSWR<{ stats: MktAnalyticsStats }>(swrKey, fetcher, {
    onError: () => toast.error("ไม่สามารถโหลดข้อมูล Analytics ได้"),
  });

  const stats: MktAnalyticsStats | null = swrData?.stats ?? initialData?.stats ?? null;

  const searchCustomRange = useCallback(async () => {
    if (!startDate || !endDate) return;
    try {
      const data = await get<{ stats: MktAnalyticsStats }>(`/api/marketing/analytics?startDate=${startDate}&endDate=${endDate}`);
      mutate(data ?? undefined, false);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูล Analytics ได้");
    }
  }, [startDate, endDate, mutate]);

  const setPeriod = useCallback((p) => {
    if (p !== "custom") {
      setStartDate("");
      setEndDate("");
    }
    setPeriodState(p);
  }, []);

  const reload = useCallback(async () => {
    if (period === "custom" && startDate && endDate) {
      try {
        const data = await get<{ stats: MktAnalyticsStats }>(`/api/marketing/analytics?refresh=1&startDate=${startDate}&endDate=${endDate}`);
        mutate(data ?? undefined, false);
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูล Analytics ได้");
      }
    } else {
      mutate();
    }
  }, [period, startDate, endDate, mutate]);

  return (
    <AnalyticsView
      stats={stats}
      loading={loading}
      reload={reload}
      period={period}
      setPeriod={setPeriod}
      startDate={startDate}
      endDate={endDate}
      setStartDate={setStartDate}
      setEndDate={setEndDate}
      searchCustomRange={searchCustomRange}
    />
  );
}
