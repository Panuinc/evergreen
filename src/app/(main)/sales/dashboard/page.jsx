"use client";

import { useCrmDashboard } from "@/modules/sales/hooks/useCrmDashboard";
import DashboardView from "@/modules/sales/components/DashboardView";

export default function SalesDashboardPage() {
  const { data, loading } = useCrmDashboard();

  return <DashboardView data={data} loading={loading} />;
}
