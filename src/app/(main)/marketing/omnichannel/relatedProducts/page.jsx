"use client";

import { useRelatedProducts } from "@/modules/marketing/hooks/useRelatedProducts";
import { useOmStockItems } from "@/modules/marketing/hooks/useOmStockItems";
import RelatedProductsView from "@/modules/marketing/components/RelatedProductsView";

export default function RelatedProductsPage() {
  const { relatedProducts, loading, add, remove } = useRelatedProducts();
  const { items: stockItems, loading: stockLoading } = useOmStockItems();

  return (
    <RelatedProductsView
      relatedProducts={relatedProducts}
      loading={loading || stockLoading}
      stockItems={stockItems}
      onAdd={add}
      onDelete={remove}
    />
  );
}
