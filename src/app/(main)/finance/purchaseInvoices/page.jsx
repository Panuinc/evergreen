"use client";

import { usePurchaseInvoices } from "@/hooks/finance/usePurchaseInvoices";
import PurchaseInvoicesView from "@/components/finance/PurchaseInvoicesView";

export default function PurchaseInvoicesPage() {
  const { data, loading, selected, isOpen, onClose, openLines } = usePurchaseInvoices();

  return (
    <PurchaseInvoicesView
      data={data}
      loading={loading}
      selected={selected}
      isOpen={isOpen}
      onClose={onClose}
      openLines={openLines}
    />
  );
}
