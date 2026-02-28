"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getMarketingAnalytics } from "@/modules/marketing/actions";

export function useMarketingAnalytics() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriodState] = useState("all");

  const loadData = useCallback(async (refresh = false, p = "all") => {
    try {
      setLoading(true);
      const data = await getMarketingAnalytics(refresh, p);
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
    loadData(false, period);
  }, [period, loadData]);

  const setPeriod = useCallback((p) => {
    setPeriodState(p);
  }, []);

  const reload = useCallback(() => {
    loadData(true, period);
  }, [loadData, period]);

  return { orders, stats, loading, period, setPeriod, reload };
}
