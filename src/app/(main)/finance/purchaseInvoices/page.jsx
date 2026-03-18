import { api } from "@/lib/api.server";
import PurchaseInvoicesClient from "@/modules/finance/PurchaseInvoicesClient";

function calcDaysOverdue(dueDate) {
  if (!dueDate || dueDate === "0001-01-01") return 0;
  const diff = Math.floor((new Date() - new Date(dueDate)) / 86400000);
  return Math.max(0, diff);
}

export default async function PurchaseInvoicesPage() {
  const raw = await api("/api/finance/purchaseInvoices?status=Open&expand=true");
  const data = (raw || []).map((r) => ({
    ...r,
    daysOverdue: r.status === "Open" ? calcDaysOverdue(r.dueDate) : 0,
  }));

  return <PurchaseInvoicesClient initialData={data} />;
}
