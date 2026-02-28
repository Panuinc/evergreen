"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAgedReceivables } from "@/actions/finance";

export function useAgedReceivables() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAgedReceivables()
      .then((rows) => setData(rows.filter((r) => r.customerNumber && Number(r.balanceDue) !== 0)))
      .catch(() => toast.error("โหลดอายุหนี้ลูกหนี้ล้มเหลว"))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
