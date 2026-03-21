"use client";

import { useState } from "react";
import AgedReceivablesView from "@/modules/finance/components/agedReceivablesView";
import type { AgedReceivable, AgedReceivablesClientProps } from "@/modules/finance/types";

export default function AgedReceivablesClient({ initialData }: AgedReceivablesClientProps) {
  const [data] = useState<AgedReceivable[]>(initialData);
  return <AgedReceivablesView data={data} loading={false} />;
}
