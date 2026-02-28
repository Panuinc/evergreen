"use client";

import { useMarketingAnalytics } from "@/modules/marketing/hooks/useMarketingAnalytics";
import AnalyticsView from "@/modules/marketing/components/AnalyticsView";

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
