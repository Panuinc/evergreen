"use client";

import { useHrDashboard } from "@/modules/hr/hooks/useHrDashboard";
import HrDashboardView from "@/modules/hr/components/HrDashboardView";

export default function HRDashboardPage() {
  const { stats, loading, compareMode, setCompareMode } = useHrDashboard();

  return (
    <HrDashboardView
      stats={stats}
      loading={loading}
      compareMode={compareMode}
      setCompareMode={setCompareMode}
    />
  );
}
