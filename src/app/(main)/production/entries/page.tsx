import { api } from "@/lib/api.server";
import EntriesClient from "@/modules/production/entriesClient";
import type { ItemLedgerEntry } from "@/modules/production/types";

export default async function ProductionEntriesPage() {
  const data = await api<ItemLedgerEntry[]>("/api/bc/production");

  return <EntriesClient initialData={data || []} />;
}
