import { api } from "@/lib/api.server";
import MktQuotationsClient from "@/modules/marketing/mktQuotationsClient";
import type { MktQuotation } from "@/modules/marketing/types";

export default async function QuotationListPage() {
  const quotations = await api<MktQuotation[]>("/api/marketing/omnichannel/quotations");

  return <MktQuotationsClient initialQuotations={quotations || []} />;
}
