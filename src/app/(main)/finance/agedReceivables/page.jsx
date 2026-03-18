import { api } from "@/lib/api.server";
import AgedReceivablesClient from "@/modules/finance/AgedReceivablesClient";

export default async function AgedReceivablesPage() {
  const raw = await api("/api/finance/agedReceivables");
  const data = (raw || []).filter((r) => r.customerNumber && Number(r.balanceDue) !== 0);

  return <AgedReceivablesClient initialData={data} />;
}
