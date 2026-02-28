"use client";

import { useItDashboard } from "@/hooks/it/useItDashboard";
import DashboardView from "@/components/it/DashboardView";

export default function ITDashboardPage() {
  const { stats, loading } = useItDashboard();

  return <DashboardView stats={stats} loading={loading} />;
}
