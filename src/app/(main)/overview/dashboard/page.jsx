"use client";

import { useOverviewDashboard } from "@/modules/overview/hooks/useOverviewDashboard";
import DashboardView from "@/modules/overview/components/DashboardView";

export default function OverviewDashboardPage() {
  const props = useOverviewDashboard();

  return <DashboardView {...props} />;
}
