import { api } from "@/lib/api.server";
import EntriesClient from "@/modules/production/EntriesClient";

export default async function ProductionEntriesPage() {
  const data = await api("/api/bc/production");

  return <EntriesClient initialData={data || []} />;
}
