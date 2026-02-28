"use client";
import { useState, useEffect, useCallback } from "react";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { getSalesInvoices } from "@/modules/finance/actions";

function calcDaysOverdue(dueDate) {
  if (!dueDate || dueDate === "0001-01-01") return 0;
  const diff = Math.floor((new Date() - new Date(dueDate)) / 86400000);
  return Math.max(0, diff);
}

export function useSalesInvoices() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    getSalesInvoices("Open")
      .then((rows) =>
        setData(rows.map((r) => ({ ...r, daysOverdue: r.status === "Open" ? calcDaysOverdue(r.dueDate) : 0 })))
      )
      .catch(() => toast.error("โหลดใบแจ้งหนี้ขายล้มเหลว"))
      .finally(() => setLoading(false));
  }, []);

  const openLines = useCallback((inv) => {
    setSelected(inv);
    onOpen();
  }, [onOpen]);

  return { data, loading, selected, isOpen, onClose, openLines };
}
