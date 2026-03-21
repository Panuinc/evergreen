"use client";

import dynamic from "next/dynamic";
import Loading from "@/components/ui/loading";
import type { ShippingLabelClientProps } from "@/modules/marketing/types";

const ShippingLabelDocument = dynamic(
  () => import("@/app/(main)/marketing/shippingLabel/[no]/shippingLabelDocument"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    ),
  },
);

export default function ShippingLabelClient({ orderNo }: ShippingLabelClientProps) {
  return <ShippingLabelDocument orderNo={orderNo} />;
}
