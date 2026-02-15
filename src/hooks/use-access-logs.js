"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAccessLogs } from "@/actions/rbac";

export function useAccessLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await getAccessLogs();
      setLogs(data);
    } catch (error) {
      toast.error("Failed to load access logs");
    } finally {
      setLoading(false);
    }
  };

  return { logs, loading };
}
