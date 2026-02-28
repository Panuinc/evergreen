"use client";

import { useBcSalesOrders } from "@/hooks/bc/useBcSalesOrders";
import BcSalesOrdersView from "@/components/bc/BcSalesOrdersView";

export default function BcSalesOrdersPage() {
  const { salesOrders, loading, selectedOrder, isOpen, onClose, openLines } =
    useBcSalesOrders();

  return (
    <BcSalesOrdersView
      salesOrders={salesOrders}
      loading={loading}
      selectedOrder={selectedOrder}
      isOpen={isOpen}
      onClose={onClose}
      openLines={openLines}
    />
  );
}
