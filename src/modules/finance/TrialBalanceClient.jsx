"use client";

import { useState } from "react";
import TrialBalanceView from "@/modules/finance/components/TrialBalanceView";

export default function TrialBalanceClient({ initialData }) {
  const [data] = useState(initialData);
  return <TrialBalanceView data={data} loading={false} />;
}
