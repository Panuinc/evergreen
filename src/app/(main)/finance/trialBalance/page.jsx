"use client";

import { useTrialBalance } from "@/modules/finance/hooks/useTrialBalance";
import TrialBalanceView from "@/modules/finance/components/TrialBalanceView";

export default function TrialBalancePage() {
  const { data, loading } = useTrialBalance();
  return <TrialBalanceView data={data} loading={loading} />;
}
