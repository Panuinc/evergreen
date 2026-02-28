"use client";

import { useBcItems } from "@/modules/bc/hooks/useBcItems";
import BcItemsView from "@/modules/bc/components/BcItemsView";

export default function BcItemsPage() {
  const { items, loading } = useBcItems();

  return <BcItemsView items={items} loading={loading} />;
}
