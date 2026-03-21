"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import BcSalesOrdersView from "@/modules/bc/components/bcSalesOrdersView";
import type { BcSalesOrder, BcSalesOrdersClientProps } from "@/modules/bc/types";

export default function SalesOrdersClient({ initialSalesOrders }: BcSalesOrdersClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<BcSalesOrder | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const openLines = (order: BcSalesOrder) => {
    setSelectedOrder(order);
    onOpen();
  };

  return (
    <BcSalesOrdersView
      salesOrders={initialSalesOrders}
      loading={false}
      selectedOrder={selectedOrder}
      isOpen={isOpen}
      onClose={onClose}
      openLines={openLines}
    />
  );
}
