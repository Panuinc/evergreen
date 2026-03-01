"use client";

import { useTmsAlerts } from "@/modules/tms/hooks/useTmsAlerts";
import AlertsView from "@/modules/tms/components/AlertsView";

export default function AlertsPage() {
  const { allAlerts, alertCount, criticalCount, warningCount, loading } =
    useTmsAlerts();

  return (
    <AlertsView
      alerts={allAlerts}
      alertCount={alertCount}
      criticalCount={criticalCount}
      warningCount={warningCount}
      loading={loading}
    />
  );
}
