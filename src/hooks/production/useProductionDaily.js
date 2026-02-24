"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getProductionDaily } from "@/actions/production";

export function useProductionDaily() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getProductionDaily();
        setEntries(data);
      } catch {
        toast.error("โหลดข้อมูลรายวันล้มเหลว");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { entries, loading };
}
