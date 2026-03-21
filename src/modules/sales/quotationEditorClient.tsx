"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import { get, put, post } from "@/lib/apiClient";
import QuotationEditorView from "@/modules/sales/components/quotationEditorView";
import type { SalesQuotation, SalesQuotationLine } from "@/modules/sales/types";

const emptyLine: SalesQuotationLine = {
  salesQuotationLineOrder: 0,
  salesQuotationLineProductName: "",
  salesQuotationLineDescription: "",
  salesQuotationLineQuantity: 1,
  salesQuotationLineUnitPrice: 0,
  salesQuotationLineDiscount: 0,
  salesQuotationLineAmount: 0,
};

export default function QuotationEditorClient() {
  const params = useParams();
  const quotationId = params.id as string;
  const router = useRouter();

  type QuotationWithLines = SalesQuotation & { lines?: SalesQuotationLine[] };
  const fetcher = (url: string) => get<QuotationWithLines>(url);
  const { data: swrData, isLoading: loading, mutate } = useSWR<QuotationWithLines>(
    quotationId ? `/api/sales/quotations/${quotationId}` : null,
    fetcher,
  );

  const [quotation, setQuotation] = useState<SalesQuotation | null>(null);
  const [lines, setLines] = useState<SalesQuotationLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  useEffect(() => {
    if (swrData) {
      setQuotation(swrData);
      setLines(swrData.lines || []);
      setDiscount(parseFloat(String(swrData.salesQuotationDiscount)) || 0);
      setTax(parseFloat(String(swrData.salesQuotationTax)) || 0);
    }
  }, [swrData]);

  const addLine = () => {
    setLines((prev) => [...prev, { ...emptyLine }]);
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = useCallback((index: number, field: string, value: string | number) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      const qty = parseFloat(String(updated[index].salesQuotationLineQuantity)) || 0;
      const price = parseFloat(String(updated[index].salesQuotationLineUnitPrice)) || 0;
      const disc = parseFloat(String(updated[index].salesQuotationLineDiscount)) || 0;
      updated[index].salesQuotationLineAmount = qty * price - disc;
      return updated;
    });
  }, []);

  const calcSubtotal = useCallback(() => {
    return lines.reduce((sum, l) => sum + (parseFloat(String(l.salesQuotationLineAmount)) || 0), 0);
  }, [lines]);

  const calcTotal = useCallback(() => {
    const subtotal = calcSubtotal();
    return subtotal - discount + tax;
  }, [calcSubtotal, discount, tax]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const subtotal = calcSubtotal();
      const total = calcTotal();

      await put(`/api/sales/quotations/${quotationId}`, {
        salesQuotationSubtotal: subtotal,
        salesQuotationDiscount: discount,
        salesQuotationTax: tax,
        salesQuotationTotal: total,
        salesQuotationNotes: quotation?.salesQuotationNotes,
        salesQuotationTerms: quotation?.salesQuotationTerms,
        salesQuotationValidUntil: quotation?.salesQuotationValidUntil,
        salesQuotationContactId: quotation?.salesQuotationContactId,
        salesQuotationAccountId: quotation?.salesQuotationAccountId,
        lines,
      });
      toast.success("บันทึกใบเสนอราคาสำเร็จ");
      mutate();
    } catch (error) {
      toast.error((error as Error).message || "บันทึกใบเสนอราคาล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action: string, note?: string): Promise<void> => {
    try {
      setSaving(true);

      if (action === "submit") {
        await handleSave();
      }
      const result = await post(`/api/sales/quotations/${quotationId}`, { action, note });
      const messages: Record<string, string> = {
        submit: "ส่งใบเสนอราคาเพื่ออนุมัติแล้ว",
        approve: "อนุมัติใบเสนอราคาแล้ว",
        reject: "ปฏิเสธใบเสนอราคาแล้ว",
        convert_order: "สร้างคำสั่งซื้อจากใบเสนอราคาสำเร็จ",
      };
      toast.success(messages[action] || "ดำเนินการสำเร็จ");
      void result;
      mutate();
    } catch (error) {
      toast.error((error as Error).message || "ดำเนินการล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const updateQuotationField = (field: string, value: string) => {
    setQuotation((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const onNavigateBack = () => {
    router.push("/sales/quotations");
  };

  return (
    <QuotationEditorView
      quotation={quotation}
      lines={lines}
      loading={loading}
      saving={saving}
      discount={discount}
      tax={tax}
      setDiscount={setDiscount}
      setTax={setTax}
      addLine={addLine}
      removeLine={removeLine}
      updateLine={updateLine}
      calcSubtotal={calcSubtotal}
      calcTotal={calcTotal}
      handleSave={handleSave}
      handleAction={handleAction}
      updateQuotationField={updateQuotationField}
      onNavigateBack={onNavigateBack}
    />
  );
}
