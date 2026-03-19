import { api } from "@/lib/api.server";
import OmQuotationsClient from "@/modules/marketing/omQuotationsClient";

export default async function QuotationListPage() {
  const quotations = await api("/api/marketing/omnichannel/quotations");

  return <OmQuotationsClient initialQuotations={quotations || []} />;
}
