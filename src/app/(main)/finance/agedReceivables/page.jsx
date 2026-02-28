"use client";

import { useAgedReceivables } from "@/hooks/finance/useAgedReceivables";
import AgedReceivablesView from "@/components/finance/AgedReceivablesView";

export default function AgedReceivablesPage() {
  const { data, loading } = useAgedReceivables();
  return <AgedReceivablesView data={data} loading={loading} />;
}
