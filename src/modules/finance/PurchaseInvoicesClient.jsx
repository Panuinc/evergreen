"use client";

import { useState, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import PurchaseInvoicesView from "@/modules/finance/components/PurchaseInvoicesView";

export default function PurchaseInvoicesClient({ initialData }) {
  const [data] = useState(initialData);
  const [selected, setSelected] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const openLines = useCallback((inv) => {
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
