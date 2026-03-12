"use client";

import { usePromotions } from "@/modules/marketing/hooks/usePromotions";
import { useOmStockItems } from "@/modules/marketing/hooks/useOmStockItems";
import PromotionsView from "@/modules/marketing/components/PromotionsView";

export default function PromotionsPage() {
  const { promotions, loading, add, update, remove } = usePromotions();
  const { items: stockItems, loading: stockLoading } = useOmStockItems();

  return (
    <PromotionsView
      promotions={promotions}
      loading={loading || stockLoading}
      stockItems={stockItems}
      onAdd={add}
      onUpdate={update}
      onDelete={remove}
    />
  );
}
