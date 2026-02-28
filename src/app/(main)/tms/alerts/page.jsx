"use client";

import { useTmsAlerts } from "@/hooks/tms/useTmsAlerts";
import AlertsView from "@/components/tms/AlertsView";

export default function AlertsPage() {
  const {
    alerts,
    alertCount,
    criticalCount,
    warningCount,
    loading,
    filter,
    setFilter,
    loadAlerts,
  } = useTmsAlerts();

  return (
    <AlertsView
      alerts={alerts}
      alertCount={alertCount}
      criticalCount={criticalCount}
      warningCount={warningCount}
      loading={loading}
      filter={filter}
      setFilter={setFilter}
      loadAlerts={loadAlerts}
    />
  );
}
