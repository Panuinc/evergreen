import { api } from "@/lib/api.server";
import OpportunitiesClient from "@/modules/sales/OpportunitiesClient";

export default async function OpportunitiesPage() {
  const opportunities = await api("/api/sales/opportunities");

  return <OpportunitiesClient initialOpportunities={opportunities || []} />;
}
