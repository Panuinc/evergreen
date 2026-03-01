"use client";

import { useOmStockItems } from "@/modules/marketing/hooks/useOmStockItems";
import StockItemsView from "@/modules/marketing/components/StockItemsView";

export default function StockItemsPage() {
  const { items, loading, prices, updatePrice } = useOmStockItems();

  return (
    <StockItemsView
      items={items}
      loading={loading}
      prices={prices}
      updatePrice={updatePrice}
    />
  );
}
