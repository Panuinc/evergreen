"use client";

import { usePromotions } from "@/modules/marketing/hooks/usePromotions";
import PromotionsView from "@/modules/marketing/components/PromotionsView";

export default function PromotionsPage() {
  const { promotions, loading, add, update, remove } = usePromotions();

  return (
    <PromotionsView
      promotions={promotions}
      loading={loading}
      onAdd={add}
      onUpdate={update}
      onDelete={remove}
    />
  );
}
