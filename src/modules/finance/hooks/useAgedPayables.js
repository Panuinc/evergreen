"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAgedPayables } from "@/modules/finance/actions";

export function useAgedPayables() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAgedPayables()
      .then((rows) => setData(rows.filter((p) => p.vendorNumber && Number(p.balanceDue) !== 0)))
      .catch(() => toast.error("โหลดอายุหนี้เจ้าหนี้ล้มเหลว"))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
