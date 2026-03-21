import { api } from "@/lib/api.server";
import CollectionsClient from "@/modules/finance/collectionsClient";
import type { AgedReceivable, ArFollowUp } from "@/modules/finance/types";

export default async function CollectionsPage() {
  const [arData, fuData] = await Promise.all([
    api("/api/finance/agedReceivables"),
    api("/api/finance/collections"),
  ]);

  return (
    <CollectionsClient
      initialAr={(arData as AgedReceivable[]) || []}
      initialFu={(fuData as ArFollowUp[]) || []}
    />
  );
}
