"use client";

import { useTrialBalance } from "@/hooks/finance/useTrialBalance";
import TrialBalanceView from "@/components/finance/TrialBalanceView";

export default function TrialBalancePage() {
  const { data, loading } = useTrialBalance();
  return <TrialBalanceView data={data} loading={loading} />;
}
