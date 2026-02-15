"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getConfigCheck } from "@/actions/configCheck";

export function useConfigCheck() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getConfigCheck();
      setStatus(data);
    } catch (error) {
      toast.error("Failed to check config status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { status, loading, refetch };
}
