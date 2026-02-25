"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getProductionDashboard } from "@/actions/production";

export function useProductionDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getProductionDashboard();
      setData(result);
    } catch (error) {
      toast.error("โหลดข้อมูลแดชบอร์ดการผลิตล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, reload: loadData };
}
