"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getQuotation,
  updateQuotation,
  quotationAction,
} from "@/actions/sales";

const emptyLine = {
  lineProductName: "",
  lineDescription: "",
  lineQuantity: 1,
  lineUnitPrice: 0,
  lineDiscount: 0,
  lineAmount: 0,
};

export function useCrmQuotationEditor(quotationId) {
  const [quotation, setQuotation] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  useEffect(() => {
    if (quotationId) loadData();
  }, [quotationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getQuotation(quotationId);
      setQuotation(data);
      setLines(data.lines || []);
      setDiscount(parseFloat(data.quotationDiscount) || 0);
      setTax(parseFloat(data.quotationTax) || 0);
    } catch (error) {
      toast.error("Failed to load quotation");
    } finally {
      setLoading(false);
    }
  };

  const addLine = () => {
    setLines((prev) => [...prev, { ...emptyLine }]);
  };

  const removeLine = (index) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLine = useCallback((index, field, value) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      // Auto-calc amount
      const qty = parseFloat(updated[index].lineQuantity) || 0;
      const price = parseFloat(updated[index].lineUnitPrice) || 0;
      const disc = parseFloat(updated[index].lineDiscount) || 0;
      updated[index].lineAmount = qty * price - disc;
      return updated;
    });
  }, []);

  const calcSubtotal = useCallback(() => {
    return lines.reduce((sum, l) => sum + (parseFloat(l.lineAmount) || 0), 0);
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

      await updateQuotation(quotationId, {
        quotationSubtotal: subtotal,
        quotationDiscount: discount,
        quotationTax: tax,
        quotationTotal: total,
        quotationNotes: quotation.quotationNotes,
        quotationTerms: quotation.quotationTerms,
        quotationValidUntil: quotation.quotationValidUntil,
        quotationContactId: quotation.quotationContactId,
        quotationAccountId: quotation.quotationAccountId,
        lines,
      });
      toast.success("Quotation saved");
      loadData();
    } catch (error) {
      toast.error(error.message || "Failed to save quotation");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action, note) => {
    try {
      setSaving(true);
      // Auto-save before action
      if (["submit"].includes(action)) {
        await handleSave();
      }
      const result = await quotationAction(quotationId, action, note);
      const messages = {
        submit: "Quotation submitted for approval",
        approve: "Quotation approved",
        reject: "Quotation rejected",
        convert_order: "Order created from quotation",
      };
      toast.success(messages[action] || "Action completed");
      loadData();
      return result;
    } catch (error) {
      toast.error(error.message || "Failed to perform action");
    } finally {
      setSaving(false);
    }
  };

  const updateQuotationField = (field, value) => {
    setQuotation((prev) => ({ ...prev, [field]: value }));
  };

  return {
    quotation,
    lines,
    loading,
    saving,
    discount,
    tax,
    setDiscount,
    setTax,
    addLine,
    removeLine,
    updateLine,
    calcSubtotal,
    calcTotal,
    handleSave,
    handleAction,
    updateQuotationField,
  };
}
