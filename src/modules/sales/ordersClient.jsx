"use client";

import { useState, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { put, del } from "@/lib/apiClient";
import OrdersView from "@/modules/sales/components/ordersView";

export default function OrdersClient({ initialOrders }) {
  const [orders, setOrders] = useState(initialOrders);
  const [saving, setSaving] = useState(false);
  const deleteModal = useDisclosure();
  const [deletingOrder, setDeletingOrder] = useState(null);
  const detailModal = useDisclosure();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const reloadOrders = async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get("/api/sales/orders");
      setOrders(data);
    } catch {}
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      setSaving(true);
      await put(`/api/sales/orders/${order.crmOrderId}`, { crmOrderStatus: newStatus });
      toast.success(`เปลี่ยนสถานะคำสั่งซื้อเป็น ${newStatus} สำเร็จ`);
      reloadOrders();
    } catch (error) {
      toast.error(error.message || "อัปเดตคำสั่งซื้อล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetail = (order) => {
    setSelectedOrder(order);
    detailModal.onOpen();
  };

  const confirmDelete = (order) => {
    setDeletingOrder(order);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    try {
      await del(`/api/sales/orders/${deletingOrder.crmOrderId}`);
      toast.success("ลบคำสั่งซื้อสำเร็จ");
      deleteModal.onClose();
      setDeletingOrder(null);
      reloadOrders();
    } catch (error) {
      toast.error(error.message || "ลบคำสั่งซื้อล้มเหลว");
    }
  };

  return (
    <OrdersView
      orders={orders}
      loading={false}
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
