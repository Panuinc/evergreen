import { api } from "@/lib/api.server";
import BcItemsView from "@/modules/bc/components/BcItemsView";

export default async function BcItemsPage() {
  const items = await api("/api/bc/items");

  return <BcItemsView items={items || []} loading={false} />;
}
