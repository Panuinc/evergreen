"use client";

import { useState } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { put, del } from "@/lib/apiClient";
import OrdersView from "@/modules/sales/components/ordersView";
import type { SalesOrder, OrdersClientProps } from "@/modules/sales/types";

export default function OrdersClient({ initialOrders }: OrdersClientProps) {
  const [orders, setOrders] = useState<SalesOrder[]>(initialOrders);
  const [saving, setSaving] = useState(false);
  const deleteModal = useDisclosure();
  const [deletingOrder, setDeletingOrder] = useState<SalesOrder | null>(null);
  const detailModal = useDisclosure();
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  const reloadOrders = async () => {
    try {
      const { get } = await import("@/lib/apiClient");
      const data = await get<SalesOrder[]>("/api/sales/orders");
      setOrders(data);
    } catch {}
  };

  const handleStatusChange = async (order: SalesOrder, newStatus: string) => {
    try {
      setSaving(true);
      await put(`/api/sales/orders/${order.salesOrderId}`, { salesOrderStatus: newStatus });
      toast.success(`เปลี่ยนสถานะคำสั่งซื้อเป็น ${newStatus} สำเร็จ`);
      reloadOrders();
    } catch (error) {
      toast.error((error as Error).message || "อัปเดตคำสั่งซื้อล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetail = (order: SalesOrder) => {
    setSelectedOrder(order);
    detailModal.onOpen();
  };

  const confirmDelete = (order: SalesOrder) => {
    setDeletingOrder(order);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    try {
      await del(`/api/sales/orders/${deletingOrder.salesOrderId}`);
      toast.success("ลบคำสั่งซื้อสำเร็จ");
      deleteModal.onClose();
      setDeletingOrder(null);
      reloadOrders();
    } catch (error) {
      toast.error((error as Error).message || "ลบคำสั่งซื้อล้มเหลว");
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
