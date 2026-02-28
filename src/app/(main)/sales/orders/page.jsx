"use client";

import { useCrmOrders } from "@/hooks/sales/useCrmOrders";
import OrdersView from "@/components/sales/OrdersView";

export default function OrdersPage() {
  const {
    orders,
    loading,
    saving,
    statusFilter,
    setStatusFilter,
    selectedOrder,
    detailModal,
    deletingOrder,
    deleteModal,
    handleStatusChange,
    handleViewDetail,
    confirmDelete,
    handleDelete,
    reload,
  } = useCrmOrders();

  return (
    <OrdersView
      orders={orders}
      loading={loading}
      saving={saving}
      selectedOrder={selectedOrder}
      detailModal={detailModal}
      deletingOrder={deletingOrder}
      deleteModal={deleteModal}
      handleStatusChange={handleStatusChange}
      handleViewDetail={handleViewDetail}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
    />
  );
}
