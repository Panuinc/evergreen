import { api } from "@/lib/api.server";
import SalesInvoicesClient from "@/modules/finance/salesInvoicesClient";
import type { SalesInvoice } from "@/modules/finance/types";

function calcDaysOverdue(dueDate: string | null | undefined): number {
  if (!dueDate || dueDate === "0001-01-01") return 0;
  const diff = Math.floor((new Date().getTime() - new Date(dueDate).getTime()) / 86400000);
  return Math.max(0, diff);
}

export default async function SalesInvoicesPage() {
  const raw = await api("/api/finance/salesInvoices?status=Open&expand=true");
  const data: SalesInvoice[] = ((raw as SalesInvoice[]) || []).map((r: SalesInvoice) => ({
    ...r,
    daysOverdue: r.bcPostedSalesInvoiceStatus === "Open" ? calcDaysOverdue(r.bcPostedSalesInvoiceDueDate) : 0,
  }));

  return <SalesInvoicesClient initialData={data} />;
}
