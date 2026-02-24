"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { getBcSalesOrders } from "@/actions/bc";

export function useBcSalesOrders() {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadSalesOrders();
  }, []);

  const loadSalesOrders = async () => {
    try {
      setLoading(true);
      const data = await getBcSalesOrders();
      setSalesOrders(data);
    } catch (error) {
      toast.error("โหลดคำสั่งขายจาก Business Central ล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const openLines = (order) => {
    setSelectedOrder(order);
    onOpen();
  };

  return { salesOrders, loading, selectedOrder, isOpen, onClose, openLines };
}
