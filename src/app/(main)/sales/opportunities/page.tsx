import { api } from "@/lib/api.server";
import OpportunitiesClient from "@/modules/sales/opportunitiesClient";
import type { SalesOpportunity } from "@/modules/sales/types";

export default async function OpportunitiesPage() {
  const opportunities = await api<SalesOpportunity[]>("/api/sales/opportunities");

  return <OpportunitiesClient initialOpportunities={opportunities || []} />;
}
