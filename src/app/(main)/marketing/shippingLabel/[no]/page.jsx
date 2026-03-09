"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Loading from "@/components/ui/Loading";
const ShippingLabelDocument = dynamic(
  () => import("./ShippingLabelDocument"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center py-20">
        <Loading />
      </div>
    ),
  },
);

export default function ShippingLabelPage() {
  const { no } = useParams();
  return <ShippingLabelDocument orderNo={decodeURIComponent(no)} />;
}
