import { api } from "@/lib/api.server";
import CollectionsClient from "@/modules/finance/collectionsClient";
import type { CollectionsMergedRow, ArFollowUp } from "@/modules/finance/types";

export default async function CollectionsPage() {
  const [mergedData, fuData] = await Promise.all([
    api("/api/finance/collectionsMerged"),
    api("/api/finance/collections"),
  ]);

  return (
    <CollectionsClient
      initialMerged={(mergedData as CollectionsMergedRow[]) || []}
      initialFu={(fuData as ArFollowUp[]) || []}
    />
  );
}
