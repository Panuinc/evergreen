import { api } from "@/lib/api.server";
import TrialBalanceClient from "@/modules/finance/TrialBalanceClient";

export default async function TrialBalancePage() {
  const data = await api("/api/finance/trialBalance");

  return <TrialBalanceClient initialData={data || []} />;
}
