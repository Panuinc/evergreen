"use client";

import { useSalesInvoices } from "@/hooks/finance/useSalesInvoices";
import SalesInvoicesView from "@/components/finance/SalesInvoicesView";

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
