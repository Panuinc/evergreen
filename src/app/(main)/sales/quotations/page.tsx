import { api } from "@/lib/api.server";
import QuotationsClient from "@/modules/sales/quotationsClient";
import type { SalesQuotation } from "@/modules/sales/types";

export default async function QuotationsPage() {
  const quotations = await api<SalesQuotation[]>("/api/sales/quotations");

  return <QuotationsClient initialQuotations={quotations || []} />;
}
