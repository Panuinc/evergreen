"use client";

import { useTmsAlerts } from "@/modules/tms/hooks/useTmsAlerts";
import AlertsView from "@/modules/tms/components/AlertsView";

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
