"use client";

import { useState } from "react";
import TrialBalanceView from "@/modules/finance/components/trialBalanceView";
import type { TrialBalanceAccount, TrialBalanceClientProps } from "@/modules/finance/types";

export default function TrialBalanceClient({ initialData }: TrialBalanceClientProps) {
  const [data] = useState<TrialBalanceAccount[]>(initialData);
  return <TrialBalanceView data={data} loading={false} />;
}
