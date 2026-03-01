"use client";

import { useSalesDashboard } from "@/modules/sales/hooks/useSalesDashboard";
import DashboardView from "@/modules/sales/components/DashboardView";

export default function SalesDashboardPage() {
  const { data, loading } = useSalesDashboard();

  return <DashboardView data={data} loading={loading} />;
}
