"use client";

import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";

const ShippingLabelDocument = dynamic(
  () => import("@/app/(main)/marketing/shippingLabel/[no]/ShippingLabelDocument"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    ),
  },
);

export default function ShippingLabelClient({ orderNo }) {
  return <ShippingLabelDocument orderNo={orderNo} />;
}
