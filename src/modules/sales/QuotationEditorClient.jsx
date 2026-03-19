"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { get, put, post } from "@/lib/apiClient";
import QuotationEditorView from "@/modules/sales/components/QuotationEditorView";

const emptyLine = {
  crmQuotationLineProductName: "",
  crmQuotationLineDescription: "",
  crmQuotationLineQuantity: 1,
  crmQuotationLineUnitPrice: 0,
  crmQuotationLineDiscount: 0,
  crmQuotationLineAmount: 0,
};

export default function QuotationEditorClient() {
  const params = useParams();
  const quotationId = params.id;
  const router = useRouter();

  const [quotation, setQuotation] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  useEffect(() => {
    if (quotationId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await get(`/api/sales/quotations/${quotationId}`);
      setQuotation(data);
      setLines(data.lines || []);
      setDiscount(parseFloat(data.crmQuotationDiscount) || 0);
      setTax(parseFloat(data.crmQuotationTax) || 0);
    } catch (error) {
      toast.error("โหลดใบเสนอราคาล้มเหลว");
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

      const qty = parseFloat(updated[index].crmQuotationLineQuantity) || 0;
      const price = parseFloat(updated[index].crmQuotationLineUnitPrice) || 0;
      const disc = parseFloat(updated[index].crmQuotationLineDiscount) || 0;
      updated[index].crmQuotationLineAmount = qty * price - disc;
      return updated;
    });
  }, []);

  const calcSubtotal = useCallback(() => {
    return lines.reduce((sum, l) => sum + (parseFloat(l.crmQuotationLineAmount) || 0), 0);
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
        crmQuotationSubtotal: subtotal,
        crmQuotationDiscount: discount,
        crmQuotationTax: tax,
        crmQuotationTotal: total,
        crmQuotationNotes: quotation.crmQuotationNotes,
        crmQuotationTerms: quotation.crmQuotationTerms,
        crmQuotationValidUntil: quotation.crmQuotationValidUntil,
        crmQuotationContactId: quotation.crmQuotationContactId,
        crmQuotationAccountId: quotation.crmQuotationAccountId,
        lines,
      });
      toast.success("บันทึกใบเสนอราคาสำเร็จ");
      loadData();
    } catch (error) {
      toast.error(error.message || "บันทึกใบเสนอราคาล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action, note) => {
    try {
      setSaving(true);

      if (["submit"].includes(action)) {
        await handleSave();
      }
      const result = await post(`/api/sales/quotations/${quotationId}`, { action, note });
      const messages = {
        submit: "ส่งใบเสนอราคาเพื่ออนุมัติแล้ว",
        approve: "อนุมัติใบเสนอราคาแล้ว",
        reject: "ปฏิเสธใบเสนอราคาแล้ว",
        convert_order: "สร้างคำสั่งซื้อจากใบเสนอราคาสำเร็จ",
      };
      toast.success(messages[action] || "ดำเนินการสำเร็จ");
      loadData();
      return result;
    } catch (error) {
      toast.error(error.message || "ดำเนินการล้มเหลว");
    } finally {
      setSaving(false);
    }
  };

  const updateQuotationField = (field, value) => {
    setQuotation((prev) => ({ ...prev, [field]: value }));
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
