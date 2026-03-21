import { api } from "@/lib/api.server";
import RelatedProductsClient from "@/modules/marketing/relatedProductsClient";
import type { MktRelatedProduct, MktStockItem } from "@/modules/marketing/types";

export default async function RelatedProductsPage() {
  const [relatedProducts, stockItems] = await Promise.all([
    api<MktRelatedProduct[]>("/api/marketing/omnichannel/relatedProducts"),
    api<MktStockItem[]>("/api/marketing/omnichannel/stockItems"),
  ]);

  return (
    <RelatedProductsClient
      initialRelatedProducts={relatedProducts || []}
      initialStockItems={stockItems || []}
    />
  );
}
