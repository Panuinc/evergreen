"use client";

import { useBcSalesOrders } from "@/modules/bc/hooks/useBcSalesOrders";
import BcSalesOrdersView from "@/modules/bc/components/BcSalesOrdersView";

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
