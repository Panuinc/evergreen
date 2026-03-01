"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getQuotation, updateQuotation, quotationAction } from "@/modules/marketing/actions";

export function useOmQuotationEditor(id) {
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
    lines.reduce((sum, l) => sum + (l.omQuotationLineQuantity || 0) * (l.omQuotationLineUnitPrice || 0), 0);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateQuotation(id, {
        omQuotationCustomerName: quotation.omQuotationCustomerName,
        omQuotationCustomerPhone: quotation.omQuotationCustomerPhone,
        omQuotationCustomerAddress: quotation.omQuotationCustomerAddress,
        omQuotationPaymentMethod: quotation.omQuotationPaymentMethod,
        omQuotationNotes: quotation.omQuotationNotes,
        lines: lines.map((l) => ({
          omQuotationLineId: l.omQuotationLineId,
          omQuotationLineProductName: l.omQuotationLineProductName,
          omQuotationLineVariant: l.omQuotationLineVariant,
          omQuotationLineQuantity: l.omQuotationLineQuantity,
          omQuotationLineUnitPrice: l.omQuotationLineUnitPrice,
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
          omQuotationCustomerName: quotation.omQuotationCustomerName,
          omQuotationCustomerPhone: quotation.omQuotationCustomerPhone,
          omQuotationCustomerAddress: quotation.omQuotationCustomerAddress,
          omQuotationPaymentMethod: quotation.omQuotationPaymentMethod,
          omQuotationNotes: quotation.omQuotationNotes,
          lines: lines.map((l) => ({
            omQuotationLineId: l.omQuotationLineId,
            omQuotationLineProductName: l.omQuotationLineProductName,
            omQuotationLineVariant: l.omQuotationLineVariant,
            omQuotationLineQuantity: l.omQuotationLineQuantity,
            omQuotationLineUnitPrice: l.omQuotationLineUnitPrice,
          })),
        });
      }
      await quotationAction(id, action, note);
      const messages = {
        submit: "ส่งอนุมัติเรียบร้อย",
        approve: "อนุมัติเรียบร้อย ส่งลิงก์และข้อมูลชำระเงินให้ลูกค้าแล้ว",
        reject: "ส่งกลับแก้ไข",
        confirm_payment: "ยืนยันชำระเงินเรียบร้อย",
      };
      toast.success(messages[action] || "ดำเนินการเรียบร้อย");
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
