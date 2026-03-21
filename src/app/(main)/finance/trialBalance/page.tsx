import { api } from "@/lib/api.server";
import TrialBalanceClient from "@/modules/finance/trialBalanceClient";
import type { TrialBalanceAccount } from "@/modules/finance/types";

export default async function TrialBalancePage() {
  const data = await api("/api/finance/trialBalance");

  return <TrialBalanceClient initialData={(data as TrialBalanceAccount[]) || []} />;
}
