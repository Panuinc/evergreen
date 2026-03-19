"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { get } from "@/lib/apiClient";
import ReportsView from "@/modules/sales/components/reportsView";

export default function SalesReportsClient() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(null);

  const loadData = useCallback(async (mode) => {
    try {
      setLoading(true);
      const params = mode ? `?compareMode=${mode}` : "";
      const result = await get(`/api/sales/dashboard${params}`);
      setData(result);
    } catch (error) {
      toast.error("โหลดแดชบอร์ดล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(compareMode);
  }, [compareMode, loadData]);

  return <ReportsView data={data} loading={loading} />;
}
