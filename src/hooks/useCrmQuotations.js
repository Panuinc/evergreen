"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getQuotationsList, deleteQuotation } from "@/actions/sales";
import { useDisclosure } from "@heroui/react";

export function useCrmQuotations() {
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
          ? data.filter((q) => q.quotationStatus === statusFilter)
          : data
      );
    } catch (error) {
      toast.error("Failed to load quotations");
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
      await deleteQuotation(deletingQuotation.quotationId);
      toast.success("Quotation deleted");
      deleteModal.onClose();
      setDeletingQuotation(null);
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to delete quotation");
    }
  };

  return {
    quotations,
    loading,
    statusFilter,
    setStatusFilter,
    deletingQuotation,
    deleteModal,
    confirmDelete,
    handleDelete,
    reload: loadData,
  };
}
