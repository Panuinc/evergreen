"use client";

import { useHrDashboard } from "@/modules/hr/hooks/useHrDashboard";
import HrDashboardView from "@/modules/hr/components/HrDashboardView";

export default function HRDashboardPage() {
  const { stats, loading } = useHrDashboard();

  return <HrDashboardView stats={stats} loading={loading} />;
}
