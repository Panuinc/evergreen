"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getMarketingAnalytics } from "@/modules/marketing/actions";

export function useMarketingAnalytics() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriodState] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadData = useCallback(async (refresh = false, p = "all", sd, ed) => {
    try {
      setLoading(true);
      const data = await getMarketingAnalytics(refresh, p, sd, ed);
      setOrders(data.orders || []);
      setStats(data.stats || null);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูล Analytics ได้");
      console.error("[Marketing Analytics]", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (period !== "custom") {
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

  const setCustomRange = useCallback((sd, ed) => {
    setStartDate(sd);
    setEndDate(ed);
    setPeriodState("custom");
  }, []);

  const reload = useCallback(() => {
    if (period === "custom" && startDate && endDate) {
      loadData(true, "custom", startDate, endDate);
    } else {
      loadData(true, period);
    }
  }, [loadData, period, startDate, endDate]);

  return { orders, stats, loading, period, setPeriod, startDate, endDate, setStartDate, setEndDate, setCustomRange, searchCustomRange, reload };
}
