"use client";

import { useOmStockItems } from "@/modules/marketing/hooks/useOmStockItems";
import { usePromotions } from "@/modules/marketing/hooks/usePromotions";
import StockItemsView from "@/modules/marketing/components/StockItemsView";

export default function StockItemsPage() {
  const { items, loading, prices, updatePrice, productInfoMap, updateProductInfo, saveAllProductInfo } =
    useOmStockItems();
  const { promotions, loading: promoLoading } = usePromotions();

  return (
    <StockItemsView
      items={items}
      loading={loading || promoLoading}
      prices={prices}
      updatePrice={updatePrice}
      productInfoMap={productInfoMap}
      updateProductInfo={updateProductInfo}
      saveAllProductInfo={saveAllProductInfo}
      promotions={promotions}
    />
  );
}
