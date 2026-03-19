import { api } from "@/lib/api.server";
import LeadsClient from "@/modules/sales/leadsClient";

export default async function LeadsPage() {
  const leads = await api("/api/sales/leads");

  return <LeadsClient initialLeads={leads || []} />;
}
