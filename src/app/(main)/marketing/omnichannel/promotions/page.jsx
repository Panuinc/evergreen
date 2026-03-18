import { api } from "@/lib/api.server";
import PromotionsClient from "@/modules/marketing/PromotionsClient";

export default async function PromotionsPage() {
  const [promotions, stockItems] = await Promise.all([
    api("/api/marketing/omnichannel/promotions"),
    api("/api/marketing/omnichannel/stockItems"),
  ]);

  return (
    <PromotionsClient
      initialPromotions={promotions || []}
      initialStockItems={stockItems || []}
    />
  );
}
