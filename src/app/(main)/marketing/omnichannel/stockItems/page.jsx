"use client";

import { useOmStockItems } from "@/modules/marketing/hooks/useOmStockItems";
import StockItemsView from "@/modules/marketing/components/StockItemsView";

export default function StockItemsPage() {
  const { items, loading, prices, updatePrice, productInfoMap, updateProductInfo, saveAllProductInfo } =
    useOmStockItems();

  return (
    <StockItemsView
      items={items}
      loading={loading}
      prices={prices}
      updatePrice={updatePrice}
      productInfoMap={productInfoMap}
      updateProductInfo={updateProductInfo}
      saveAllProductInfo={saveAllProductInfo}
    />
  );
}
