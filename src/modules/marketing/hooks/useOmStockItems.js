"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getStockItems, getProductInfo, saveProductInfo } from "@/modules/marketing/actions";

export function useOmStockItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState({});
  const [productInfoMap, setProductInfoMap] = useState({});

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const [stockData, infoData] = await Promise.all([
        getStockItems(),
        getProductInfo().catch(() => []),
      ]);
      setItems(stockData);

      const initialPrices = {};
      for (const item of stockData) {
        if (item.customPrice != null) {
          initialPrices[item.bcItemNumber] = item.customPrice;
        }
      }
      setPrices(initialPrices);

      const infoMap = {};
      for (const info of infoData) {
        infoMap[info.omProductInfoItemNumber] = {
          description: info.omProductInfoDescription || "",
          highlights: info.omProductInfoHighlights || "",
          category: info.omProductInfoCategory || "",
        };
      }
      setProductInfoMap(infoMap);
    } catch (error) {
      toast.error("โหลดรายการสินค้าล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

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
      .filter(([, info]) => info.description || info.highlights || info.category)
      .map(([number, info]) => ({
        itemNumber: number,
        description: info.description || null,
        highlights: info.highlights || null,
        category: info.category || null,
      }));

    if (toSave.length === 0) return;
    await saveProductInfo(toSave);
  };

  return { items, loading, prices, updatePrice, productInfoMap, updateProductInfo, saveAllProductInfo };
}
