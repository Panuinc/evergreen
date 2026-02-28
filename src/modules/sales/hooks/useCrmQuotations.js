"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getQuotationsList, deleteQuotation } from "@/modules/sales/actions";
import { useDisclosure } from "@heroui/react";

export function useCrmQuotations() {
  const router = useRouter();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const deleteModal = useDisclosure();
  const [deletingQuotation, setDeletingQuotation] = useState(null);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getQuotationsList();
      setQuotations(
        statusFilter
          ? data.filter((q) => q.crmQuotationStatus === statusFilter)
          : data
      );
    } catch (error) {
      toast.error("โหลดใบเสนอราคาล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (quotation) => {
    setDeletingQuotation(quotation);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingQuotation) return;
    try {
      await deleteQuotation(deletingQuotation.crmQuotationId);
      toast.success("ลบใบเสนอราคาสำเร็จ");
      deleteModal.onClose();
      setDeletingQuotation(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "ลบใบเสนอราคาล้มเหลว");
    }
  };

  const handleNew = useCallback(async () => {
    try {
      const { createQuotation } = await import("@/modules/sales/actions");
      const newQ = await createQuotation({});
      router.push(`/sales/quotations/${newQ.crmQuotationId}`);
    } catch (error) {
      toast.error("ไม่สามารถสร้างใบเสนอราคาได้");
    }
  }, [router]);

  const onNavigateToQuotation = useCallback(
    (quotationId) => {
      router.push(`/sales/quotations/${quotationId}`);
    },
    [router]
  );

  return {
    quotations,
    loading,
    statusFilter,
    setStatusFilter,
    deletingQuotation,
    deleteModal,
    confirmDelete,
    handleDelete,
    handleNew,
    onNavigateToQuotation,
    reload: loadData,
  };
}
