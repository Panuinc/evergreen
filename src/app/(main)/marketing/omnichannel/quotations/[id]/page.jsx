"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Input,
  Textarea,
  Chip,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { ArrowLeft, ExternalLink, Send, Check, X } from "lucide-react";
import { get, put } from "@/lib/apiClient";
import { toast } from "sonner";

const STATUS_MAP = {
  draft: { label: "ร่าง", color: "default" },
  pending_approval: { label: "รออนุมัติ", color: "warning" },
  approved: { label: "อนุมัติแล้ว", color: "success" },
  rejected: { label: "ไม่อนุมัติ", color: "danger" },
};

export default function QuotationEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quotation, setQuotation] = useState(null);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const rejectModal = useDisclosure();

  const loadQuotation = useCallback(async () => {
    try {
      setLoading(true);
      const data = await get(`/api/marketing/omnichannel/quotations/${id}`);
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

  const handleSave = async () => {
    try {
      setSaving(true);
      await put(`/api/marketing/omnichannel/quotations/${id}`, {
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
        await put(`/api/marketing/omnichannel/quotations/${id}`, {
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
      await fetch(`/api/marketing/omnichannel/quotations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      }).then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
      });
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
      rejectModal.onClose();
    }
  };

  const updateLine = (index, field, value) => {
    setLines((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const calcTotal = () =>
    lines.reduce((sum, l) => sum + (l.lineQuantity || 0) * (l.lineUnitPrice || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center h-full text-default-400">
        ไม่พบใบเสนอราคา
      </div>
    );
  }

  const status = STATUS_MAP[quotation.quotationStatus] || STATUS_MAP.draft;
  const canEdit = ["draft", "rejected"].includes(quotation.quotationStatus);
  const canSubmit = canEdit;
  const canApprove = quotation.quotationStatus === "pending_approval";

  return (
    <div className="flex flex-col w-full h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="light"
            size="sm"
            radius="md"
            onPress={() => router.push("/marketing/omnichannel/quotations")}
          >
            <ArrowLeft size={18} />
          </Button>
          <h2 className="text-lg font-semibold">{quotation.quotationNumber}</h2>
          <Chip size="sm" variant="flat" color={status.color}>
            {status.label}
          </Chip>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="bordered"
            size="md"
            radius="md"
            startContent={<ExternalLink size={14} />}
            onPress={() => window.open(`/quotation/${id}`, "_blank")}
          >
            ดูใบเสนอราคา
          </Button>
          {canEdit && (
            <Button
              color="primary"
              size="md"
              radius="md"
              onPress={handleSave}
              isLoading={saving}
            >
              บันทึก
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="ชื่อลูกค้า"
            labelPlacement="outside"
            variant="bordered"
            radius="md"
            size="md"
            value={quotation.quotationCustomerName || ""}
            onValueChange={(v) => setQuotation((q) => ({ ...q, quotationCustomerName: v }))}
            isReadOnly={!canEdit}
          />
          <Input
            label="เบอร์โทร"
            labelPlacement="outside"
            variant="bordered"
            radius="md"
            size="md"
            value={quotation.quotationCustomerPhone || ""}
            onValueChange={(v) => setQuotation((q) => ({ ...q, quotationCustomerPhone: v }))}
            isReadOnly={!canEdit}
          />
          <Input
            label="ที่อยู่จัดส่ง"
            labelPlacement="outside"
            variant="bordered"
            radius="md"
            size="md"
            value={quotation.quotationCustomerAddress || ""}
            onValueChange={(v) => setQuotation((q) => ({ ...q, quotationCustomerAddress: v }))}
            isReadOnly={!canEdit}
            className="col-span-2"
          />
          <Input
            label="ช่องทางชำระเงิน"
            labelPlacement="outside"
            variant="bordered"
            radius="md"
            size="md"
            value={quotation.quotationPaymentMethod || ""}
            onValueChange={(v) => setQuotation((q) => ({ ...q, quotationPaymentMethod: v }))}
            isReadOnly={!canEdit}
          />
        </div>

        {/* Lines */}
        <div>
          <p className="font-semibold mb-2">รายการสินค้า</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-default">
                <th className="text-left py-2 px-2 w-8">#</th>
                <th className="text-left py-2 px-2">สินค้า</th>
                <th className="text-left py-2 px-2 w-40">รุ่น/สี/ขนาด</th>
                <th className="text-right py-2 px-2 w-24">จำนวน</th>
                <th className="text-right py-2 px-2 w-32">ราคา/หน่วย</th>
                <th className="text-right py-2 px-2 w-32">รวม</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr key={line.lineId} className="border-b border-default">
                  <td className="py-2 px-2">{line.lineOrder}</td>
                  <td className="py-2 px-2">
                    {canEdit ? (
                      <Input
                        variant="bordered"
                        radius="md"
                        size="sm"
                        value={line.lineProductName}
                        onValueChange={(v) => updateLine(i, "lineProductName", v)}
                      />
                    ) : (
                      line.lineProductName
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {canEdit ? (
                      <Input
                        variant="bordered"
                        radius="md"
                        size="sm"
                        value={line.lineVariant || ""}
                        onValueChange={(v) => updateLine(i, "lineVariant", v)}
                      />
                    ) : (
                      line.lineVariant || "-"
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {canEdit ? (
                      <Input
                        variant="bordered"
                        radius="md"
                        size="sm"
                        type="number"
                        classNames={{ input: "text-right" }}
                        value={String(line.lineQuantity)}
                        onValueChange={(v) => updateLine(i, "lineQuantity", Number(v) || 0)}
                      />
                    ) : (
                      <span className="block text-right">{line.lineQuantity}</span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    {canEdit ? (
                      <Input
                        variant="bordered"
                        radius="md"
                        size="sm"
                        type="number"
                        classNames={{ input: "text-right" }}
                        value={String(line.lineUnitPrice)}
                        onValueChange={(v) => updateLine(i, "lineUnitPrice", Number(v) || 0)}
                      />
                    ) : (
                      <span className="block text-right">
                        {(line.lineUnitPrice || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-right font-medium">
                    {((line.lineQuantity || 0) * (line.lineUnitPrice || 0)).toLocaleString("th-TH", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-default">
                <td colSpan={5} className="py-2 px-2 text-right font-semibold">
                  รวมทั้งสิ้น
                </td>
                <td className="py-2 px-2 text-right font-bold">
                  {calcTotal().toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes */}
        <Textarea
          label="หมายเหตุ"
          labelPlacement="outside"
          variant="bordered"
          radius="md"
          size="md"
          minRows={2}
          value={quotation.quotationNotes || ""}
          onValueChange={(v) => setQuotation((q) => ({ ...q, quotationNotes: v }))}
          isReadOnly={!canEdit}
        />

        {/* Approval Info */}
        {quotation.quotationApprovalNote && (
          <div className="p-3 bg-danger-50 rounded-lg border border-danger-200">
            <p className="text-sm font-semibold text-danger mb-1">เหตุผลที่ไม่อนุมัติ:</p>
            <p className="text-sm">{quotation.quotationApprovalNote}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pb-4">
          {canSubmit && (
            <Button
              color="primary"
              size="md"
              radius="md"
              startContent={<Send size={14} />}
              onPress={() => handleAction("submit")}
              isLoading={saving}
            >
              ส่งอนุมัติ
            </Button>
          )}
          {canApprove && (
            <>
              <Button
                color="danger"
                variant="bordered"
                size="md"
                radius="md"
                startContent={<X size={14} />}
                onPress={rejectModal.onOpen}
              >
                ไม่อนุมัติ
              </Button>
              <Button
                color="success"
                size="md"
                radius="md"
                startContent={<Check size={14} />}
                onPress={() => handleAction("approve")}
                isLoading={saving}
              >
                อนุมัติ
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal.isOpen} onClose={rejectModal.onClose} size="md">
        <ModalContent>
          <ModalHeader>เหตุผลที่ไม่อนุมัติ</ModalHeader>
          <ModalBody>
            <Textarea
              variant="bordered"
              radius="md"
              placeholder="ระบุเหตุผล..."
              value={rejectNote}
              onValueChange={setRejectNote}
              minRows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" radius="md" onPress={rejectModal.onClose}>
              ยกเลิก
            </Button>
            <Button
              color="danger"
              radius="md"
              onPress={() => handleAction("reject", rejectNote)}
              isLoading={saving}
            >
              ไม่อนุมัติ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
