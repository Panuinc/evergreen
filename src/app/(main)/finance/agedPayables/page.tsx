import { api } from "@/lib/api.server";
import AgedPayablesClient from "@/modules/finance/agedPayablesClient";
import type { AgedPayable } from "@/modules/finance/types";

export default async function AgedPayablesPage() {
  const raw = await api("/api/finance/agedPayables");
  const data = ((raw as AgedPayable[]) || []).filter(
    (p) => p.bcVendorLedgerEntryVendorNo && Number(p.bcVendorLedgerEntryRemainingAmount) !== 0
  );

  return <AgedPayablesClient initialData={data} />;
}
