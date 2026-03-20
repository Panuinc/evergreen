import { api } from "@/lib/api.server";
import CollectionsClient from "@/modules/finance/collectionsClient";

export default async function CollectionsPage() {
  const [arData, fuData] = await Promise.all([
    api("/api/finance/agedReceivables"),
    api("/api/finance/collections"),
  ]);

  return (
    <CollectionsClient
      initialAr={arData || []}
      initialFu={fuData || []}
    />
  );
}
