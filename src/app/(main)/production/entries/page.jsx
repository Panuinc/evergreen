"use client";

import { useProduction } from "@/hooks/production/useProduction";
import EntriesView from "@/components/production/EntriesView";

export default function ProductionEntriesPage() {
  const { data, loading } = useProduction();

  return <EntriesView data={data} loading={loading} />;
}
