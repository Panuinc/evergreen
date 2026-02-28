"use client";

import { useCrmDashboard } from "@/hooks/sales/useCrmDashboard";
import ReportsView from "@/components/sales/ReportsView";

export default function SalesReportsPage() {
  const { data, loading } = useCrmDashboard();

  return <ReportsView data={data} loading={loading} />;
}
