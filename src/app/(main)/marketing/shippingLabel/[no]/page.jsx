import ShippingLabelClient from "@/modules/marketing/ShippingLabelClient";

export default async function ShippingLabelPage({ params }) {
  const { no } = await params;
  return <ShippingLabelClient orderNo={decodeURIComponent(no)} />;
}
