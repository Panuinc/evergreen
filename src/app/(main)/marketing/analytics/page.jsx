"use client";

import { useMarketingAnalytics } from "@/hooks/marketing/useMarketingAnalytics";
import AnalyticsView from "@/components/marketing/AnalyticsView";

export default function MarketingAnalyticsPage() {
  const { stats, loading, reload, period, setPeriod } = useMarketingAnalytics();

  return (
    <AnalyticsView
      stats={stats}
      loading={loading}
      reload={reload}
      period={period}
      setPeriod={setPeriod}
    />
  );
}
