"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { getOrders, updateOrder, deleteOrder } from "@/actions/sales";

export function useCrmOrders() {
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
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(
        statusFilter
          ? data.filter((o) => o.orderStatus === statusFilter)
          : data
      );
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      setSaving(true);
      await updateOrder(order.orderId, { orderStatus: newStatus });
      toast.success(`Order status changed to ${newStatus}`);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to update order");
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
      await deleteOrder(deletingOrder.orderId);
      toast.success("Order deleted");
      deleteModal.onClose();
      setDeletingOrder(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete order");
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
