"use client";

import { useCrmDashboard } from "@/modules/sales/hooks/useCrmDashboard";
import ReportsView from "@/modules/sales/components/ReportsView";

export default function SalesReportsPage() {
  const { data, loading } = useCrmDashboard();

  return <ReportsView data={data} loading={loading} />;
}
