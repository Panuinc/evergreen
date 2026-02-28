"use client";

import { useBcItems } from "@/hooks/bc/useBcItems";
import BcItemsView from "@/components/bc/BcItemsView";

export default function BcItemsPage() {
  const { items, loading } = useBcItems();

  return <BcItemsView items={items} loading={loading} />;
}
