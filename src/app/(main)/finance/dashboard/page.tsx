import { api } from "@/lib/api.server";
import FinanceDashboardClient from "@/modules/finance/financeDashboardClient";
import type { TrialBalanceAccount, AgedReceivable, AgedPayable, SalesInvoice, PurchaseInvoice } from "@/modules/finance/types";

export default async function FinanceDashboardPage() {
  const [tb, ar, ap, si, pi] = await Promise.all([
    api("/api/finance/trialBalance"),
    api("/api/finance/agedReceivables"),
    api("/api/finance/agedPayables"),
    api("/api/finance/salesInvoices?status=Open&expand=false"),
    api("/api/finance/purchaseInvoices?status=Open&expand=false"),
  ]);

  return (
    <FinanceDashboardClient
      initialTb={(tb as TrialBalanceAccount[]) || []}
      initialAr={(ar as AgedReceivable[]) || []}
      initialAp={(ap as AgedPayable[]) || []}
      initialSi={(si as SalesInvoice[]) || []}
      initialPi={(pi as PurchaseInvoice[]) || []}
    />
  );
}
