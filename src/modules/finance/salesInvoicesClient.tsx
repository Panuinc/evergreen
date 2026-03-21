"use client";

import { useState, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import SalesInvoicesView from "@/modules/finance/components/salesInvoicesView";
import type { SalesInvoice, SalesInvoicesClientProps } from "@/modules/finance/types";

export default function SalesInvoicesClient({ initialData }: SalesInvoicesClientProps) {
  const [data] = useState<SalesInvoice[]>(initialData);
  const [selected, setSelected] = useState<SalesInvoice | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const openLines = useCallback((inv: SalesInvoice) => {
    setSelected(inv);
    onOpen();
  }, [onOpen]);

  return (
    <SalesInvoicesView
      data={data}
      loading={false}
      selected={selected}
      isOpen={isOpen}
      onClose={onClose}
      openLines={openLines}
    />
  );
}
