import { api } from "@/lib/api.server";
import FinanceDashboardClient from "@/modules/finance/financeDashboardClient";

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
      initialTb={tb || []}
      initialAr={ar || []}
      initialAp={ap || []}
      initialSi={si || []}
      initialPi={pi || []}
    />
  );
}
