import { api } from "@/lib/api.server";
import MktQuotationsClient from "@/modules/marketing/mktQuotationsClient";

export default async function QuotationListPage() {
  const quotations = await api("/api/marketing/omnichannel/quotations");

  return <MktQuotationsClient initialQuotations={quotations || []} />;
}
