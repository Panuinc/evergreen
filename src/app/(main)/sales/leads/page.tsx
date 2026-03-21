import { api } from "@/lib/api.server";
import LeadsClient from "@/modules/sales/leadsClient";
import type { SalesLead } from "@/modules/sales/types";

export default async function LeadsPage() {
  const leads = await api<SalesLead[]>("/api/sales/leads");

  return <LeadsClient initialLeads={leads || []} />;
}
