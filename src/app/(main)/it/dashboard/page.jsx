"use client";

import { useItDashboard } from "@/modules/it/hooks/useItDashboard";
import DashboardView from "@/modules/it/components/DashboardView";

export default function ITDashboardPage() {
  const { stats, loading } = useItDashboard();

  return <DashboardView stats={stats} loading={loading} />;
}
