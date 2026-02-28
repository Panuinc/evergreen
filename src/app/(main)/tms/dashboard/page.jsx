"use client";

import { useTmsDashboard } from "@/modules/tms/hooks/useTmsDashboard";
import DashboardView from "@/modules/tms/components/DashboardView";

export default function TmsDashboardPage() {
  const { stats, loading } = useTmsDashboard();

  return <DashboardView stats={stats} loading={loading} />;
}
