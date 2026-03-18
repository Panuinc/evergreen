"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { get } from "@/lib/apiClient";

export function useProduction() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await get("/api/bc/production");
      setData(result);
    } catch (error) {
      toast.error("โหลดข้อมูลการผลิตล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, reload: loadData };
}
