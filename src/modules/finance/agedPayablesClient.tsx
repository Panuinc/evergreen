"use client";

import { useState } from "react";
import AgedPayablesView from "@/modules/finance/components/agedPayablesView";
import type { AgedPayable, AgedPayablesClientProps } from "@/modules/finance/types";

export default function AgedPayablesClient({ initialData }: AgedPayablesClientProps) {
  const [data] = useState<AgedPayable[]>(initialData);
  return <AgedPayablesView data={data} loading={false} />;
}
