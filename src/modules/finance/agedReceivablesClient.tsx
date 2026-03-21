"use client";

import { useState } from "react";
import AgedReceivablesView from "@/modules/finance/components/agedReceivablesView";

export default function AgedReceivablesClient({ initialData }) {
  const [data] = useState(initialData);
  return <AgedReceivablesView data={data} loading={false} />;
}
