"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@heroui/react";
import { toast } from "sonner";
import { del } from "@/lib/apiClient";
import QuotationsView from "@/modules/sales/components/quotationsView";
import type { SalesQuotation, QuotationsClientProps } from "@/modules/sales/types";

export default function QuotationsClient({ initialQuotations }: QuotationsClientProps) {
  const router = useRouter();
  const [quotations, setQuotations] = useState<SalesQuotation[]>(initialQuotations);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const deleteModal = useDisclosure();
  const [deletingQuotation, setDeletingQuotation] = useState<SalesQuotation | null>(null);

  const reloadQuotations = async (filter: string) => {
    try {
      setLoading(true);
      const { get } = await import("@/lib/apiClient");
      const data: SalesQuotation[] = await get("/api/sales/quotations");
      setQuotations(
        filter
          ? data.filter((q) => q.salesQuotationStatus === filter)
          : data
      );
    } catch {
      toast.error("โหลดใบเสนอราคาล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = useCallback((val: string) => {
    setStatusFilter(val);
    reloadQuotations(val);
  }, []);

  const confirmDelete = (quotation: SalesQuotation) => {
    setDeletingQuotation(quotation);
    deleteModal.onOpen();
  };

  const handleDelete = async () => {
    if (!deletingQuotation) return;
    try {
      await del(`/api/sales/quotations/${deletingQuotation.salesQuotationId}`);
      toast.success("ลบใบเสนอราคาสำเร็จ");
      deleteModal.onClose();
      setDeletingQuotation(null);
      reloadQuotations(statusFilter);
    } catch (error) {
      toast.error((error as Error).message || "ลบใบเสนอราคาล้มเหลว");
    }
  };

  const handleNew = useCallback(async () => {
    try {
      const { post } = await import("@/lib/apiClient");
      const newQ = await post<{ salesQuotationId: string }>("/api/sales/quotations", {});
      router.push(`/sales/quotations/${newQ.salesQuotationId}`);
    } catch {
      toast.error("ไม่สามารถสร้างใบเสนอราคาได้");
    }
  }, [router]);

  const onNavigateToQuotation = useCallback(
    (quotationId: string) => {
      router.push(`/sales/quotations/${quotationId}`);
    },
    [router]
  );

  return (
    <QuotationsView
      quotations={quotations}
      loading={loading}
      statusFilter={statusFilter}
      setStatusFilter={handleStatusFilterChange}
      deletingQuotation={deletingQuotation}
      deleteModal={deleteModal}
      confirmDelete={confirmDelete}
      handleDelete={handleDelete}
      handleNew={handleNew}
      onNavigateToQuotation={onNavigateToQuotation}
    />
  );
}
