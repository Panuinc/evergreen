"use client";

import { useAgedPayables } from "@/hooks/finance/useAgedPayables";
import AgedPayablesView from "@/components/finance/AgedPayablesView";

export default function AgedPayablesPage() {
  const { data, loading } = useAgedPayables();
  return <AgedPayablesView data={data} loading={loading} />;
}
