"use client";

import { useAgedReceivables } from "@/modules/finance/hooks/useAgedReceivables";
import AgedReceivablesView from "@/modules/finance/components/AgedReceivablesView";

export default function AgedReceivablesPage() {
  const { data, loading } = useAgedReceivables();
  return <AgedReceivablesView data={data} loading={loading} />;
}
