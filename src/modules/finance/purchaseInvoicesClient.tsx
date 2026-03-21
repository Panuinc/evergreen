"use client";

import { useState, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import PurchaseInvoicesView from "@/modules/finance/components/purchaseInvoicesView";
import type { PurchaseInvoice, PurchaseInvoicesClientProps } from "@/modules/finance/types";

export default function PurchaseInvoicesClient({ initialData }: PurchaseInvoicesClientProps) {
  const [data] = useState<PurchaseInvoice[]>(initialData);
  const [selected, setSelected] = useState<PurchaseInvoice | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const openLines = useCallback((inv: PurchaseInvoice) => {
    setSelected(inv);
    onOpen();
  }, [onOpen]);

  return (
    <PurchaseInvoicesView
      data={data}
      loading={false}
      selected={selected}
      isOpen={isOpen}
      onClose={onClose}
      openLines={openLines}
    />
  );
}
