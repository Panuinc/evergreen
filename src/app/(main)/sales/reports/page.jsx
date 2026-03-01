"use client";

import { useSalesDashboard } from "@/modules/sales/hooks/useSalesDashboard";
import ReportsView from "@/modules/sales/components/ReportsView";

export default function SalesReportsPage() {
  const { data, loading } = useSalesDashboard();

  return <ReportsView data={data} loading={loading} />;
}
