import { api } from "@/lib/api.server";
import AnalyticsClient from "@/modules/marketing/analyticsClient";
import type { MktAnalyticsStats } from "@/modules/marketing/types";

export default async function MarketingAnalyticsPage() {
  const data = await api<{ stats: MktAnalyticsStats }>("/api/marketing/analytics");

  return <AnalyticsClient initialData={data} />;
}
