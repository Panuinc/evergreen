"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getBcProduction } from "@/actions/production";

export function useProduction() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getBcProduction();
      setData(result);
    } catch (error) {
      toast.error("โหลดข้อมูลการผลิตล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, reload: loadData };
}
