import { api } from "@/lib/api.server";
import StockItemsClient from "@/modules/marketing/stockItemsClient";
import type { MktStockItem, MktProductInfo, MktPromotion } from "@/modules/marketing/types";

export default async function StockItemsPage() {
  const [stockItems, productInfo, promotions] = await Promise.all([
    api<MktStockItem[]>("/api/marketing/omnichannel/stockItems"),
    api<MktProductInfo[]>("/api/marketing/omnichannel/productInfo"),
    api<MktPromotion[]>("/api/marketing/omnichannel/promotions"),
  ]);

  return (
    <StockItemsClient
      initialItems={stockItems || []}
      initialProductInfo={productInfo || []}
      initialPromotions={promotions || []}
    />
  );
}
