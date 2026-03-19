"use client";

import { useState } from "react";
import { toast } from "sonner";
import useSWR from "swr";
import { get } from "@/lib/apiClient";
import ReportsView from "@/modules/sales/components/reportsView";

const fetcher = (url) => get(url);

export default function SalesReportsClient() {
  const [compareMode, setCompareMode] = useState(null);
  const url = compareMode ? `/api/sales/dashboard?compareMode=${compareMode}` : "/api/sales/dashboard";
  const { data, isLoading: loading } = useSWR(url, fetcher, {
    onError: () => toast.error("โหลดแดชบอร์ดล้มเหลว"),
  });

  return <ReportsView data={data || null} loading={loading} />;
}
