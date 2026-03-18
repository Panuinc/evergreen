"use client";

import { useBankRecon } from "@/modules/finance/hooks/useBankRecon";
import BankReconView from "@/modules/finance/components/BankReconView";

export default function BankReconClient() {
  const hook = useBankRecon();
  return <BankReconView {...hook} />;
}
