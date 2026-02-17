"use client";

import { useState, useCallback, useMemo } from "react";
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
import { useQuotationEditor } from "@/hooks/useQuotationEditor";
import DataTable from "@/components/ui/DataTable";

const STATUS_MAP = {
  draft: { label: "ร่าง", color: "default" },
  pending_approval: { label: "รออนุมัติ", color: "warning" },
  approved: { label: "อนุมัติแล้ว", color: "success" },
  rejected: { label: "ไม่อนุมัติ", color: "danger" },
};

export default function QuotationEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const {
    quotation,
    setQuotation,
    lines,
    loading,
    saving,
    updateLine,
    calcTotal,
    handleSave,
    handleAction,
  } = useQuotationEditor(id);
  const [rejectNote, setRejectNote] = useState("");
  const rejectModal = useDisclosure();

  const onReject = async () => {
    await handleAction("reject", rejectNote);
    rejectModal.onClose();
  };

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

  const lineColumns = [
    { name: "สินค้า", uid: "lineProductName" },
    { name: "รุ่น/สี/ขนาด", uid: "lineVariant" },
    { name: "จำนวน", uid: "lineQuantity" },
    { name: "ราคา/หน่วย", uid: "lineUnitPrice" },
    { name: "รวม", uid: "lineTotal" },
  ];

  const lineData = useMemo(
    () =>
      lines.map((line) => ({
        ...line,
        lineTotal: (line.lineQuantity || 0) * (line.lineUnitPrice || 0),
      })),
    [lines]
  );

  const renderLineCell = useCallback(
    (item, columnKey) => {
      const idx = lines.findIndex((l) => l.lineId === item.lineId);
      switch (columnKey) {
        case "lineProductName":
          return canEdit ? (
            <Input
              variant="bordered"
              radius="md"
              size="sm"
              value={item.lineProductName}
              onValueChange={(v) => updateLine(idx, "lineProductName", v)}
            />
          ) : (
            item.lineProductName
          );
        case "lineVariant":
          return canEdit ? (
            <Input
              variant="bordered"
              radius="md"
              size="sm"
              value={item.lineVariant || ""}
              onValueChange={(v) => updateLine(idx, "lineVariant", v)}
            />
          ) : (
            item.lineVariant || "-"
          );
        case "lineQuantity":
          return canEdit ? (
            <Input
              variant="bordered"
              radius="md"
              size="sm"
              type="number"
              classNames={{ input: "text-right" }}
              value={String(item.lineQuantity)}
              onValueChange={(v) => updateLine(idx, "lineQuantity", Number(v) || 0)}
            />
          ) : (
            <span className="block text-right">{item.lineQuantity}</span>
          );
        case "lineUnitPrice":
          return canEdit ? (
            <Input
              variant="bordered"
              radius="md"
              size="sm"
              type="number"
              classNames={{ input: "text-right" }}
              value={String(item.lineUnitPrice)}
              onValueChange={(v) => updateLine(idx, "lineUnitPrice", Number(v) || 0)}
            />
          ) : (
            <span className="block text-right">
              {(item.lineUnitPrice || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          );
        case "lineTotal":
          return (
            <span className="block text-right font-medium">
              {item.lineTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          );
        default:
          return item[columnKey] || "-";
      }
    },
    [lines, canEdit, updateLine]
  );

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
          <DataTable
            columns={lineColumns}
            data={lineData}
            renderCell={renderLineCell}
            rowKey="lineId"
            initialVisibleColumns={["lineProductName", "lineVariant", "lineQuantity", "lineUnitPrice", "lineTotal"]}
            emptyContent="ไม่มีรายการสินค้า"
            defaultRowsPerPage={20}
          />
          <div className="flex justify-end mt-2 px-2">
            <span className="font-semibold mr-4">รวมทั้งสิ้น</span>
            <span className="font-bold">
              {calcTotal().toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
            </span>
          </div>
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
              onPress={onReject}
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
