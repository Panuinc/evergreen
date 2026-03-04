"use client";

import { useMarketingAnalytics } from "@/modules/marketing/hooks/useMarketingAnalytics";
import AnalyticsView from "@/modules/marketing/components/AnalyticsView";

export default function MarketingAnalyticsPage() {
  const { stats, loading, reload, period, setPeriod, startDate, endDate, setStartDate, setEndDate, searchCustomRange } = useMarketingAnalytics();

  return (
    <AnalyticsView
      stats={stats}
      loading={loading}
      reload={reload}
      period={period}
      setPeriod={setPeriod}
      startDate={startDate}
      endDate={endDate}
      setStartDate={setStartDate}
      setEndDate={setEndDate}
      searchCustomRange={searchCustomRange}
    />
  );
}
