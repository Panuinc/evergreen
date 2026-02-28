"use client";

import { useCrmDashboard } from "@/hooks/sales/useCrmDashboard";
import DashboardView from "@/components/sales/DashboardView";

export default function SalesDashboardPage() {
  const { data, loading } = useCrmDashboard();

  return <DashboardView data={data} loading={loading} />;
}
