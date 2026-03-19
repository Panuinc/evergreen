"use client";

import { useState, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import SalesInvoicesView from "@/modules/finance/components/salesInvoicesView";

export default function SalesInvoicesClient({ initialData }) {
  const [data] = useState(initialData);
  const [selected, setSelected] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const openLines = useCallback((inv) => {
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
