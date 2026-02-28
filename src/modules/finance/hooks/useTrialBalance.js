"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getTrialBalance } from "@/modules/finance/actions";

export function useTrialBalance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrialBalance()
      .then(setData)
      .catch(() => toast.error("โหลดงบทดลองล้มเหลว"))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading };
}
