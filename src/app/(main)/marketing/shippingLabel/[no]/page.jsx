"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Spinner } from "@heroui/react";

const ShippingLabelDocument = dynamic(
  () => import("./ShippingLabelDocument"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    ),
  },
);

export default function ShippingLabelPage() {
  const { no } = useParams();
  return <ShippingLabelDocument orderNo={decodeURIComponent(no)} />;
}
