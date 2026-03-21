import { api } from "@/lib/api.server";
import StockItemsClient from "@/modules/marketing/stockItemsClient";

export default async function StockItemsPage() {
  const [stockItems, productInfo, promotions] = await Promise.all([
    api("/api/marketing/omnichannel/stockItems"),
    api("/api/marketing/omnichannel/productInfo"),
    api("/api/marketing/omnichannel/promotions"),
  ]);

  return (
    <StockItemsClient
      initialItems={stockItems || []}
      initialProductInfo={productInfo || []}
      initialPromotions={promotions || []}
    />
  );
}
