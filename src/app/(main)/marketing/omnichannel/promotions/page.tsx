import { api } from "@/lib/api.server";
import PromotionsClient from "@/modules/marketing/promotionsClient";
import type { MktPromotion, MktStockItem } from "@/modules/marketing/types";

export default async function PromotionsPage() {
  const [promotions, stockItems] = await Promise.all([
    api<MktPromotion[]>("/api/marketing/omnichannel/promotions"),
    api<MktStockItem[]>("/api/marketing/omnichannel/stockItems"),
  ]);

  return (
    <PromotionsClient
      initialPromotions={promotions || []}
      initialStockItems={stockItems || []}
    />
  );
}
