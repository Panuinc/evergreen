"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import AnalyticsView from "@/modules/marketing/components/analyticsView";

export default function AnalyticsClient({ initialData }) {
  const [stats, setStats] = useState(initialData?.stats || null);
  const [loading, setLoading] = useState(false);
  const [period, setPeriodState] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadData = useCallback(async (refresh = false, p = "all", sd, ed) => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const params = new URLSearchParams();
      if (refresh) params.set("refresh", "1");
      if (sd && ed) {
        params.set("startDate", sd);
        params.set("endDate", ed);
      } else if (p && p !== "all") {
        params.set("period", p);
      }
      const qs = params.toString();
      const data = await get(`/api/marketing/analytics${qs ? `?${qs}` : ""}`);
      setStats(data.stats || null);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูล Analytics ได้");
      console.error("[Marketing Analytics]", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (period !== "all" && period !== "custom") {
      loadData(false, period);
    }
  }, [period, loadData]);

  const searchCustomRange = useCallback(() => {
    if (startDate && endDate) {
      loadData(false, "custom", startDate, endDate);
    }
  }, [startDate, endDate, loadData]);

  const setPeriod = useCallback((p) => {
    if (p !== "custom") {
      setStartDate("");
      setEndDate("");
    }
    setPeriodState(p);
  }, []);

  const reload = useCallback(() => {
    if (period === "custom" && startDate && endDate) {
      loadData(true, "custom", startDate, endDate);
    } else {
      loadData(true, period);
    }
  }, [loadData, period, startDate, endDate]);

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
