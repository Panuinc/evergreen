"use client";

import { useSalesInvoices } from "@/modules/finance/hooks/useSalesInvoices";
import SalesInvoicesView from "@/modules/finance/components/SalesInvoicesView";

export default function SalesInvoicesPage() {
  const { data, loading, selected, isOpen, onClose, openLines } = useSalesInvoices();

  return (
    <SalesInvoicesView
      data={data}
      loading={loading}
      selected={selected}
      isOpen={isOpen}
      onClose={onClose}
      openLines={openLines}
    />
  );
}
