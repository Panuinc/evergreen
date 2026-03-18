"use client";

import { useOverviewDashboard } from "@/modules/overview/hooks/useOverviewDashboard";
import DashboardView from "@/modules/overview/components/DashboardView";

export default function DashboardClient() {
  const props = useOverviewDashboard();

  return <DashboardView {...props} />;
}
