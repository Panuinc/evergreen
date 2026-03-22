"use client";

import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { get } from "@/lib/apiClient";
import ReportsView from "@/modules/sales/components/reportsView";
import type { SalesDashboardData } from "@/modules/sales/types";

const fetcher = (url: string) => get<SalesDashboardData>(url);

export default function SalesReportsClient() {
  const [compareMode] = useState<string | null>(null);
  const url = compareMode ? `/api/sales/dashboard?compareMode=${compareMode}` : "/api/sales/dashboard";
  const { data, isLoading: loading } = useSWR<SalesDashboardData>(url, fetcher, {
    onError: () => toast.error("โหลดแดชบอร์ดล้มเหลว"),
    revalidateOnFocus: false,
  });

  return <ReportsView data={data ?? null} loading={loading} />;
}
