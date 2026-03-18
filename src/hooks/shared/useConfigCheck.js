"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { get } from "@/lib/apiClient";

export function useConfigCheck() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get("/api/configCheck");
      setStatus(data);
    } catch (error) {
      toast.error("ตรวจสอบสถานะการตั้งค่าล้มเหลว");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { status, loading, refetch };
}
