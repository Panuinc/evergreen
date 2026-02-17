"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getQuotation, updateQuotation, quotationAction } from "@/actions/omnichannel";

export function useQuotationEditor(id) {
  const [quotation, setQuotation] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadQuotation = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getQuotation(id);
      setQuotation(data);
      setLines(data.lines || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuotation();
  }, [loadQuotation]);

  const updateLine = (index, field, value) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const calcTotal = () =>
    lines.reduce((sum, l) => sum + (l.lineQuantity || 0) * (l.lineUnitPrice || 0), 0);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateQuotation(id, {
        quotationCustomerName: quotation.quotationCustomerName,
        quotationCustomerPhone: quotation.quotationCustomerPhone,
        quotationCustomerAddress: quotation.quotationCustomerAddress,
        quotationPaymentMethod: quotation.quotationPaymentMethod,
        quotationNotes: quotation.quotationNotes,
        lines: lines.map((l) => ({
          lineId: l.lineId,
          lineProductName: l.lineProductName,
          lineVariant: l.lineVariant,
          lineQuantity: l.lineQuantity,
          lineUnitPrice: l.lineUnitPrice,
        })),
      });
      toast.success("บันทึกเรียบร้อย");
      await loadQuotation();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action, note) => {
    try {
      setSaving(true);
      // Auto-save before submit
      if (action === "submit") {
        await updateQuotation(id, {
          quotationCustomerName: quotation.quotationCustomerName,
          quotationCustomerPhone: quotation.quotationCustomerPhone,
          quotationCustomerAddress: quotation.quotationCustomerAddress,
          quotationPaymentMethod: quotation.quotationPaymentMethod,
          quotationNotes: quotation.quotationNotes,
          lines: lines.map((l) => ({
            lineId: l.lineId,
            lineProductName: l.lineProductName,
            lineVariant: l.lineVariant,
            lineQuantity: l.lineQuantity,
            lineUnitPrice: l.lineUnitPrice,
          })),
        });
      }
      await quotationAction(id, action, note);
      toast.success(
        action === "submit" ? "ส่งอนุมัติเรียบร้อย" :
        action === "approve" ? "อนุมัติเรียบร้อย ส่งลิงก์ให้ลูกค้าแล้ว" :
        "ส่งกลับแก้ไข"
      );
      await loadQuotation();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return {
    quotation,
    setQuotation,
    lines,
    loading,
    saving,
    updateLine,
    calcTotal,
    handleSave,
    handleAction,
  };
}
