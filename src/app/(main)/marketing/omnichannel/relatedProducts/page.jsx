import { api } from "@/lib/api.server";
import RelatedProductsClient from "@/modules/marketing/relatedProductsClient";

export default async function RelatedProductsPage() {
  const [relatedProducts, stockItems] = await Promise.all([
    api("/api/marketing/omnichannel/relatedProducts"),
    api("/api/marketing/omnichannel/stockItems"),
  ]);

  return (
    <RelatedProductsClient
      initialRelatedProducts={relatedProducts || []}
      initialStockItems={stockItems || []}
    />
  );
}
