"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import useSWR from "swr";
import { get, put, patch } from "@/lib/apiClient";
import OmnichannelQuotationEditorView from "@/modules/marketing/components/omnichannelQuotationEditorView";
import type { MktQuotation, MktQuotationLine } from "@/modules/marketing/types";

const fetcher = (url: string) => get<MktQuotation>(url);

export default function OmnichannelQuotationEditorClient() {
  const { id } = useParams();
  const router = useRouter();

  const [quotation, setQuotation] = useState<MktQuotation | null>(null);
  const [lines, setLines] = useState<MktQuotationLine[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: swrData, isLoading: loading, mutate } = useSWR<MktQuotation>(
    id ? `/api/marketing/omnichannel/quotations/${id}` : null,
    fetcher,
    { revalidateOnFocus: false, onError: (err: Error) => toast.error(err.message) },
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
    lines.reduce((sum, l) => sum + (l.mktQuotationLineQuantity || 0) * (l.mktQuotationLineUnitPrice || 0), 0);

  const handleSave = async () => {
    try {
      setSaving(true);
      await put(`/api/marketing/omnichannel/quotations/${id}`, {
        mktQuotationCustomerName: quotation.mktQuotationCustomerName,
        mktQuotationCustomerPhone: quotation.mktQuotationCustomerPhone,
        mktQuotationCustomerAddress: quotation.mktQuotationCustomerAddress,
        mktQuotationPaymentMethod: quotation.mktQuotationPaymentMethod,
        mktQuotationNotes: quotation.mktQuotationNotes,
        lines: lines.map((l) => ({
          mktQuotationLineId: l.mktQuotationLineId,
          mktQuotationLineProductName: l.mktQuotationLineProductName,
          mktQuotationLineVariant: l.mktQuotationLineVariant,
          mktQuotationLineQuantity: l.mktQuotationLineQuantity,
          mktQuotationLineUnitPrice: l.mktQuotationLineUnitPrice,
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
          mktQuotationCustomerName: quotation.mktQuotationCustomerName,
          mktQuotationCustomerPhone: quotation.mktQuotationCustomerPhone,
          mktQuotationCustomerAddress: quotation.mktQuotationCustomerAddress,
          mktQuotationPaymentMethod: quotation.mktQuotationPaymentMethod,
          mktQuotationNotes: quotation.mktQuotationNotes,
          lines: lines.map((l) => ({
            mktQuotationLineId: l.mktQuotationLineId,
            mktQuotationLineProductName: l.mktQuotationLineProductName,
            mktQuotationLineVariant: l.mktQuotationLineVariant,
            mktQuotationLineQuantity: l.mktQuotationLineQuantity,
            mktQuotationLineUnitPrice: l.mktQuotationLineUnitPrice,
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
