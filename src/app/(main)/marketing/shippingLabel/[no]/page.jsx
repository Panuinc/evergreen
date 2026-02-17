"use client";

import { useParams } from "next/navigation";
import ShippingLabelDocument from "./ShippingLabelDocument";

export default function ShippingLabelPage() {
  const { no } = useParams();
  return <ShippingLabelDocument orderNo={decodeURIComponent(no)} />;
}
