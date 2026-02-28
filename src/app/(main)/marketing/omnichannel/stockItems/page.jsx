"use client";

import { useStockItems } from "@/hooks/marketing/useStockItems";
import StockItemsView from "@/components/marketing/StockItemsView";

export default function StockItemsPage() {
  const { items, loading, prices, updatePrice } = useStockItems();

  return (
    <StockItemsView
      items={items}
      loading={loading}
      prices={prices}
      updatePrice={updatePrice}
    />
  );
}
