"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getMarketingAnalytics } from "@/actions/marketing";

export function useMarketingAnalytics() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (refresh = false) => {
    try {
      setLoading(true);
      const data = await getMarketingAnalytics(refresh);
      setOrders(data.orders || []);
      setStats(data.stats || null);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูล Analytics ได้");
      console.error("[Marketing Analytics]", error);
    } finally {
      setLoading(false);
    }
  };

  return { orders, stats, loading, reload: () => loadData(true) };
}
