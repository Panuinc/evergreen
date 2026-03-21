import { api } from "@/lib/api.server";
import AnalyticsClient from "@/modules/marketing/analyticsClient";

export default async function MarketingAnalyticsPage() {
  const data = await api("/api/marketing/analytics");

  return <AnalyticsClient initialData={data} />;
}
