"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { post } from "@/lib/apiClient";
import StockItemsView from "@/modules/marketing/components/stockItemsView";

export default function StockItemsClient({ initialItems, initialProductInfo, initialPromotions }) {
  const [items] = useState(initialItems);
  const [loading] = useState(false);

  const initialPrices = useMemo(() => {
    const p = {};
    for (const item of initialItems) {
      if (item.customPrice != null) {
        p[item.bcItemNo] = item.customPrice;
      }
    }
    return p;
  }, [initialItems]);

  const initialInfoMap = useMemo(() => {
    const m = {};
    for (const info of initialProductInfo) {
      m[info.mktProductInfoItemNumber] = {
        description: info.mktProductInfoDescription || "",
        highlights: info.mktProductInfoHighlights || "",
        category: info.mktProductInfoCategory || "",
      };
    }
    return m;
  }, [initialProductInfo]);

  const [prices, setPrices] = useState(initialPrices);
  const [productInfoMap, setProductInfoMap] = useState(initialInfoMap);

  const updatePrice = (number, value) => {
    setPrices((prev) => ({ ...prev, [number]: value }));
  };

  const updateProductInfo = (number, field, value) => {
    setProductInfoMap((prev) => ({
      ...prev,
      [number]: { ...(prev[number] || {}), [field]: value },
    }));
  };

  const saveAllProductInfo = async () => {
    const toSave = Object.entries(productInfoMap)
      .filter(([, info]: [string, any]) => info.description || info.highlights || info.category)
      .map(([number, info]: [string, any]) => ({
        itemNumber: number,
        description: info.description || null,
        highlights: info.highlights || null,
        category: info.category || null,
      }));

    if (toSave.length === 0) return;
    await post("/api/marketing/omnichannel/productInfo", { items: toSave });
  };

  return (
    <StockItemsView
      items={items}
      loading={loading}
      prices={prices}
      updatePrice={updatePrice}
      productInfoMap={productInfoMap}
      updateProductInfo={updateProductInfo}
      saveAllProductInfo={saveAllProductInfo}
      promotions={initialPromotions}
    />
  );
}
