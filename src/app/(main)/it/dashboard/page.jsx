"use client";

import { useItDashboard } from "@/modules/it/hooks/useItDashboard";
import DashboardView from "@/modules/it/components/DashboardView";

export default function ITDashboardPage() {
  const { stats, loading, compareMode, setCompareMode } = useItDashboard();

  return (
    <DashboardView
      stats={stats}
      loading={loading}
      compareMode={compareMode}
      setCompareMode={setCompareMode}
    />
  );
}
