"use client";

import { useProductionDashboard } from "@/modules/production/hooks/useProductionDashboard";
import ProfitByItemView from "@/modules/production/components/ProfitByItemView";

export default function ProductionProfitPage() {
  const { data, loading, compareMode, setCompareMode } = useProductionDashboard();

  return <ProfitByItemView data={data} loading={loading} compareMode={compareMode} setCompareMode={setCompareMode} />;
}
