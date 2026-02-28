"use client";

import { useProductionDashboard } from "@/hooks/production/useProductionDashboard";
import DashboardView from "@/components/production/DashboardView";

export default function ProductionDashboardPage() {
  const { data, loading } = useProductionDashboard();

  return <DashboardView data={data} loading={loading} />;
}
