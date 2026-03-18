"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import BcSalesOrdersView from "@/modules/bc/components/BcSalesOrdersView";

export default function SalesOrdersClient({ initialSalesOrders }) {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const openLines = (order) => {
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
