"use client";

import { useStockItems } from "@/modules/marketing/hooks/useStockItems";
import StockItemsView from "@/modules/marketing/components/StockItemsView";

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
