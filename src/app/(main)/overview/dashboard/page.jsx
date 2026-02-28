"use client";

import { useOverviewDashboard } from "@/hooks/overview/useOverviewDashboard";
import DashboardView from "@/components/overview/DashboardView";

export default function OverviewDashboardPage() {
  const props = useOverviewDashboard();

  return <DashboardView {...props} />;
}
