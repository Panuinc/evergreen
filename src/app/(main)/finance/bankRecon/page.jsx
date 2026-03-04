"use client";

import { useBankRecon } from "@/modules/finance/hooks/useBankRecon";
import BankReconView from "@/modules/finance/components/BankReconView";

export default function BankReconPage() {
  const hook = useBankRecon();
  return <BankReconView {...hook} />;
}
