import { api } from "@/lib/api.server";
import BcItemsView from "@/modules/bc/components/bcItemsView";
import type { BcItem } from "@/modules/bc/types";

export default async function BcItemsPage() {
  const items = await api<BcItem[]>("/api/bc/items");

  return <BcItemsView items={items || []} loading={false} />;
}
