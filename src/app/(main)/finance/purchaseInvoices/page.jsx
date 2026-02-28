"use client";

import { usePurchaseInvoices } from "@/modules/finance/hooks/usePurchaseInvoices";
import PurchaseInvoicesView from "@/modules/finance/components/PurchaseInvoicesView";

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
