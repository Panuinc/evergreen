"use client";

import { useAgedPayables } from "@/modules/finance/hooks/useAgedPayables";
import AgedPayablesView from "@/modules/finance/components/AgedPayablesView";

export default function AgedPayablesPage() {
  const { data, loading } = useAgedPayables();
  return <AgedPayablesView data={data} loading={loading} />;
}
