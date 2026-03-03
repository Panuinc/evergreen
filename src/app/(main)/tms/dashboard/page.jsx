"use client";

import { useTmsDashboard } from "@/modules/tms/hooks/useTmsDashboard";
import DashboardView from "@/modules/tms/components/DashboardView";

export default function TmsDashboardPage() {
  const { stats, loading, compareMode, setCompareMode } = useTmsDashboard();

  return (
    <DashboardView
      stats={stats}
      loading={loading}
      compareMode={compareMode}
      setCompareMode={setCompareMode}
    />
  );
}
