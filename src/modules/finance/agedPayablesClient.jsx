"use client";

import { useState } from "react";
import AgedPayablesView from "@/modules/finance/components/agedPayablesView";

export default function AgedPayablesClient({ initialData }) {
  const [data] = useState(initialData);
  return <AgedPayablesView data={data} loading={false} />;
}
