import { api } from "@/lib/api.server";
import QuotationsClient from "@/modules/sales/quotationsClient";

export default async function QuotationsPage() {
  const quotations = await api("/api/sales/quotations");

  return <QuotationsClient initialQuotations={quotations || []} />;
}
