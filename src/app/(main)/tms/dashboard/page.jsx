"use client";

import { useTmsDashboard } from "@/hooks/tms/useTmsDashboard";
import DashboardView from "@/components/tms/DashboardView";

export default function TmsDashboardPage() {
  const { stats, loading } = useTmsDashboard();

  return <DashboardView stats={stats} loading={loading} />;
}
