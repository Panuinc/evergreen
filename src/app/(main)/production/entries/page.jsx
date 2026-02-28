"use client";

import { useProduction } from "@/modules/production/hooks/useProduction";
import EntriesView from "@/modules/production/components/EntriesView";

export default function ProductionEntriesPage() {
  const { data, loading } = useProduction();

  return <EntriesView data={data} loading={loading} />;
}
