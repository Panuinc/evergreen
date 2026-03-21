import { api } from "@/lib/api.server";
import AgedPayablesClient from "@/modules/finance/agedPayablesClient";

export default async function AgedPayablesPage() {
  const raw = await api("/api/finance/agedPayables");
  const data = (raw || []).filter((p) => p.vendorNumber && Number(p.balanceDue) !== 0);

  return <AgedPayablesClient initialData={data} />;
}
