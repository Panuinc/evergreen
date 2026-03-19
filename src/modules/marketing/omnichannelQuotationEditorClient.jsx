"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import { get, put, patch } from "@/lib/apiClient";
import OmnichannelQuotationEditorView from "@/modules/marketing/components/omnichannelQuotationEditorView";

const fetcher = (url) => get(url);

export default function OmnichannelQuotationEditorClient() {
  const { id } = useParams();
  const router = useRouter();

  const [quotation, setQuotation] = useState(null);
  const [lines, setLines] = useState([]);
  const [saving, setSaving] = useState(false);

  const { data: swrData, isLoading: loading, mutate } = useSWR(
    id ? `/api/marketing/omnichannel/quotations/${id}` : null,
    fetcher,
    { onError: (err) => toast.error(err.message) },
  );

  useEffect(() => {
    if (swrData) {
      setQuotation(swrData);
      setLines(swrData.lines || []);
    }
  }, [swrData]);

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
      await put(`/api/marketing/omnichannel/quotations/${id}`, {
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
      await mutate();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action, note) => {
    try {
      setSaving(true);

      if (action === "submit") {
        await put(`/api/marketing/omnichannel/quotations/${id}`, {
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
      await patch(`/api/marketing/omnichannel/quotations/${id}`, { action, note });
      const messages = {
        submit: "ส่งอนุมัติเรียบร้อย",
        approve: "อนุมัติเรียบร้อย ส่งลิงก์และข้อมูลชำระเงินให้ลูกค้าแล้ว",
        reject: "ส่งกลับแก้ไข",
        confirm_payment: "ยืนยันชำระเงินเรียบร้อย",
      };
      toast.success(messages[action] || "ดำเนินการเรียบร้อย");
      await mutate();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <OmnichannelQuotationEditorView
      id={id}
      quotation={quotation}
      setQuotation={setQuotation}
      lines={lines}
      loading={loading}
      saving={saving}
      updateLine={updateLine}
      calcTotal={calcTotal}
      handleSave={handleSave}
      handleAction={handleAction}
      onBack={() => router.push("/marketing/omnichannel/quotations")}
    />
  );
}
