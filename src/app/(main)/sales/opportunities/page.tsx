import { api } from "@/lib/api.server";
import OpportunitiesClient from "@/modules/sales/opportunitiesClient";

export default async function OpportunitiesPage() {
  const opportunities = await api("/api/sales/opportunities");

  return <OpportunitiesClient initialOpportunities={opportunities || []} />;
}
