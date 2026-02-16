"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getAlerts } from "@/actions/tms";

export function useTmsAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getAlerts();
      setAlerts(data.alerts);
      setAlertCount(data.totalCount);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "all") return true;
    if (filter === "critical") return a.severity === "critical";
    if (filter === "warning") return a.severity === "warning";
    return a.type === filter;
  });

  return {
    alerts: filteredAlerts,
    allAlerts: alerts,
    alertCount,
    criticalCount,
    warningCount,
    loading,
    filter,
    setFilter,
    loadAlerts,
  };
}
