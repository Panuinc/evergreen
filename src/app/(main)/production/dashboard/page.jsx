"use client";

import { useProductionDashboard } from "@/modules/production/hooks/useProductionDashboard";
import DashboardView from "@/modules/production/components/DashboardView";

export default function ProductionDashboardPage() {
  const { data, loading, compareMode, setCompareMode } = useProductionDashboard();

  return <DashboardView data={data} loading={loading} compareMode={compareMode} setCompareMode={setCompareMode} />;
}
