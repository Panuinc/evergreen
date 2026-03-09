"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { getOrders, updateOrder, deleteOrder } from "@/modules/sales/actions";

export function useSalesOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const deleteModal = useDisclosure();
  const [deletingOrder, setDeletingOrder] = useState(null);
  const detailModal = useDisclosure();
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(
        statusFilter
          ? data.filter((o) => o.crmOrderStatus === statusFilter)
          : data
      );
    } catch (error) {
      toast.error("โหลดคำสั่งซื้อล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      setSaving(true);
      await updateOrder(order.crmOrderId, { crmOrderStatus: newStatus });
      toast.success(`เปลี่ยนสถานะคำสั่งซื้อเป็น ${newStatus} สำเร็จ`);
      loadData();
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
      await deleteOrder(deletingOrder.crmOrderId);
      toast.success("ลบคำสั่งซื้อสำเร็จ");
      deleteModal.onClose();
      setDeletingOrder(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบคำสั่งซื้อล้มเหลว");
    }
  };

  return {
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
    reload: loadData,
  };
}
