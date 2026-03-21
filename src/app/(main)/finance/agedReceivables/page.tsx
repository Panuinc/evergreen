import { api } from "@/lib/api.server";
import AgedReceivablesClient from "@/modules/finance/agedReceivablesClient";
import type { AgedReceivable } from "@/modules/finance/types";

export default async function AgedReceivablesPage() {
  const raw = await api("/api/finance/agedReceivables");
  const data = ((raw as AgedReceivable[]) || []).filter(
    (r) => r.bcCustomerLedgerEntryCustomerNo && Number(r.bcCustomerLedgerEntryRemainingAmount) !== 0
  );

  return <AgedReceivablesClient initialData={data} />;
}
