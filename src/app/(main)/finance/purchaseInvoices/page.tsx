import { api } from "@/lib/api.server";
import PurchaseInvoicesClient from "@/modules/finance/purchaseInvoicesClient";
import type { PurchaseInvoice } from "@/modules/finance/types";

function calcDaysOverdue(dueDate: string | null | undefined): number {
  if (!dueDate || dueDate === "0001-01-01") return 0;
  const diff = Math.floor((new Date().getTime() - new Date(dueDate).getTime()) / 86400000);
  return Math.max(0, diff);
}

export default async function PurchaseInvoicesPage() {
  const raw = await api("/api/finance/purchaseInvoices?status=Open&expand=true");
  const data: PurchaseInvoice[] = ((raw as PurchaseInvoice[]) || []).map((r: PurchaseInvoice) => ({
    ...r,
    daysOverdue: r.bcPostedPurchInvoiceStatus === "Open" ? calcDaysOverdue(r.bcPostedPurchInvoiceDueDate) : 0,
  }));

  return <PurchaseInvoicesClient initialData={data} />;
}
