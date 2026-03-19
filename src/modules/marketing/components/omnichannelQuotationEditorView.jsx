import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import {
  Button,
  Input,
  Textarea,
  Chip,  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import { ArrowLeft, ExternalLink, Send, Check, X, Banknote, Receipt } from "lucide-react";
import DataTable from "@/components/ui/dataTable";
import Loading from "@/components/ui/loading";

const statusMap = {
  draft: { label: "ร่าง", color: "default" },
  pending_approval: { label: "รออนุมัติ", color: "warning" },
  approved: { label: "อนุมัติแล้ว", color: "success" },
  rejected: { label: "ไม่อนุมัติ", color: "danger" },
  paid: { label: "ชำระแล้ว", color: "primary" },
};

const lineColumns = [
  { name: "สินค้า", uid: "omQuotationLineProductName" },
  { name: "รุ่น/สี/ขนาด", uid: "omQuotationLineVariant" },
  { name: "จำนวน", uid: "omQuotationLineQuantity" },
  { name: "ราคา/หน่วย", uid: "omQuotationLineUnitPrice" },
  { name: "รวม", uid: "omQuotationLineTotal" },
];

export default function OmnichannelQuotationEditorView({
  id,
  quotation,
  setQuotation,
  lines,
  loading,
  saving,
  updateLine,
  calcTotal,
  handleSave,
  handleAction,
  onBack,
}) {
  const [rejectNote, setRejectNote] = useState("");
  const rejectModal = useDisclosure();

  const status = statusMap[quotation?.omQuotationStatus] || statusMap.draft;
  const canEdit = ["draft", "rejected"].includes(quotation?.omQuotationStatus);
  const canSubmit = canEdit;
  const canApprove = quotation?.omQuotationStatus === "pending_approval";
  const canConfirmPayment = quotation?.omQuotationStatus === "approved";

  const onReject = async () => {
    await handleAction("reject", rejectNote);
    rejectModal.onClose();
  };

  const lineData = useMemo(
    () =>
      (lines || []).map((line) => ({
        ...line,
        omQuotationLineTotal: (line.omQuotationLineQuantity || 0) * (line.omQuotationLineUnitPrice || 0),
      })),
    [lines]
  );

  const renderLineCell = useCallback(
    (item, columnKey) => {
      const idx = lines.findIndex((l) => l.omQuotationLineId === item.omQuotationLineId);
      switch (columnKey) {
        case "omQuotationLineProductName":
          return canEdit ? (
            <Input
              variant="bordered"
              radius="md"
              size="md"
              value={item.omQuotationLineProductName}
              onValueChange={(v) => updateLine(idx, "omQuotationLineProductName", v)}
            />
          ) : (
            item.omQuotationLineProductName
          );
        case "omQuotationLineVariant":
          return canEdit ? (
            <Input
              variant="bordered"
              radius="md"
              size="md"
              value={item.omQuotationLineVariant || ""}
              onValueChange={(v) => updateLine(idx, "omQuotationLineVariant", v)}
            />
          ) : (
            item.omQuotationLineVariant || "-"
          );
        case "omQuotationLineQuantity":
          return canEdit ? (
            <Input
              variant="bordered"
              radius="md"
              size="md"
              type="number"
              classNames={{ input: "text-right" }}
              value={String(item.omQuotationLineQuantity)}
              onValueChange={(v) => updateLine(idx, "omQuotationLineQuantity", Number(v) || 0)}
            />
          ) : (
            <span className="block text-right">{item.omQuotationLineQuantity}</span>
          );
        case "omQuotationLineUnitPrice":
          return canEdit ? (
            <Input
              variant="bordered"
              radius="md"
              size="md"
              type="number"
              classNames={{ input: "text-right" }}
              value={String(item.omQuotationLineUnitPrice)}
              onValueChange={(v) => updateLine(idx, "omQuotationLineUnitPrice", Number(v) || 0)}
            />
          ) : (
            <span className="block text-right">
              {(item.omQuotationLineUnitPrice || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          );
        case "omQuotationLineTotal":
          return (
            <span className="block text-right font-light">
              {item.omQuotationLineTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          );
        default:
          return item[columnKey] || "-";
      }
    },
    [lines, canEdit, updateLine]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center w-full h-full text-muted-foreground">
        ไม่พบใบเสนอราคา
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full overflow-auto">
      {}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="bordered"
            size="md"
            radius="md"
            onPress={onBack}
          >
            <ArrowLeft />
          </Button>
          <p className="text-xs font-light">{quotation.omQuotationNumber}</p>
          <Chip variant="flat" size="md" radius="md" color={status.color}>
            {status.label}
          </Chip>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="flat"
            size="md"
            radius="md"
            startContent={<ExternalLink />}
            onPress={() => window.open(`/quotation/${id}`, "_blank")}
          >
            ดูใบเสนอราคา
          </Button>
          {canEdit && (
            <Button
              variant="bordered"
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
        {}
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="ชื่อลูกค้า"
            labelPlacement="outside"
            variant="bordered"
            radius="md"
            size="md"
            value={quotation.omQuotationCustomerName || ""}
            onValueChange={(v) => setQuotation((q) => ({ ...q, omQuotationCustomerName: v }))}
            isReadOnly={!canEdit}
          />
          <Input
            label="เบอร์โทร"
            labelPlacement="outside"
            variant="bordered"
            radius="md"
            size="md"
            value={quotation.omQuotationCustomerPhone || ""}
            onValueChange={(v) => setQuotation((q) => ({ ...q, omQuotationCustomerPhone: v }))}
            isReadOnly={!canEdit}
          />
          <Input
            label="ที่อยู่จัดส่ง"
            labelPlacement="outside"
            variant="bordered"
            radius="md"
            size="md"
            value={quotation.omQuotationCustomerAddress || ""}
            onValueChange={(v) => setQuotation((q) => ({ ...q, omQuotationCustomerAddress: v }))}
            isReadOnly={!canEdit}
            className="col-span-2"
          />
        </div>

        {}
        <div>
          <p className="font-light mb-2">รายการสินค้า</p>
          <DataTable
            columns={lineColumns}
            data={lineData}
            renderCell={renderLineCell}
            rowKey="omQuotationLineId"
            initialVisibleColumns={["omQuotationLineProductName", "omQuotationLineVariant", "omQuotationLineQuantity", "omQuotationLineUnitPrice", "omQuotationLineTotal"]}
            emptyContent="ไม่มีรายการสินค้า"
            defaultRowsPerPage={20}
          />
          <div className="flex justify-end mt-2 px-2">
            <span className="font-light mr-4">รวมทั้งสิ้น</span>
            <span className="font-light">
              {calcTotal().toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท
            </span>
          </div>
        </div>

        {}
        <Textarea
          label="หมายเหตุ"
          labelPlacement="outside"
          variant="bordered"
          radius="md"
          size="md"
          minRows={2}
          value={quotation.omQuotationNotes || ""}
          onValueChange={(v) => setQuotation((q) => ({ ...q, omQuotationNotes: v }))}
          isReadOnly={!canEdit}
        />

        {}
        {quotation.paymentSlip?.omMessageImageUrl && (
          <div className="p-4 bg-default-50 rounded-lg border border-border">
            <p className="font-light mb-3 flex items-center gap-2">
              <Receipt />
              หลักฐานการชำระเงิน
            </p>
            <div className="flex gap-4">
              <a href={quotation.paymentSlip.omMessageImageUrl} target="_blank" rel="noopener noreferrer">
                <Image
                  src={quotation.paymentSlip.omMessageImageUrl}
                  alt="สลิปการโอนเงิน"
                  width={0}
                  height={0}
                  unoptimized
                  className="rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ maxHeight: 300, maxWidth: 220, width: "auto", height: "auto" }}
                />
              </a>
              {quotation.paymentSlip.omMessageOcrData && (
                <div className="text-xs space-y-2 flex-1">
                  {quotation.paymentSlip.omMessageOcrData.amount && (
                    <div className="flex justify-between max-w-xs">
                      <span className="text-muted-foreground">ยอดเงิน</span>
                      <span className="font-light">{Number(quotation.paymentSlip.omMessageOcrData.amount).toLocaleString()} บาท</span>
                    </div>
                  )}
                  {quotation.paymentSlip.omMessageOcrData.fromBank && (
                    <div className="flex justify-between max-w-xs">
                      <span className="text-muted-foreground">ธนาคารผู้โอน</span>
                      <span>{quotation.paymentSlip.omMessageOcrData.fromBank}</span>
                    </div>
                  )}
                  {quotation.paymentSlip.omMessageOcrData.toBank && (
                    <div className="flex justify-between max-w-xs">
                      <span className="text-muted-foreground">ธนาคารผู้รับ</span>
                      <span>{quotation.paymentSlip.omMessageOcrData.toBank}</span>
                    </div>
                  )}
                  {quotation.paymentSlip.omMessageOcrData.datetime && (
                    <div className="flex justify-between max-w-xs">
                      <span className="text-muted-foreground">วันเวลา</span>
                      <span>{quotation.paymentSlip.omMessageOcrData.datetime}</span>
                    </div>
                  )}
                  {quotation.paymentSlip.omMessageOcrData.reference && (
                    <div className="flex justify-between max-w-xs">
                      <span className="text-muted-foreground">เลขอ้างอิง</span>
                      <span>{quotation.paymentSlip.omMessageOcrData.reference}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {}
        {quotation.omQuotationApprovalNote && (
          <div className="p-3 bg-danger-50 rounded-lg border border-danger-200">
            <p className="text-xs font-light text-danger mb-1">เหตุผลที่ไม่อนุมัติ:</p>
            <p className="text-xs">{quotation.omQuotationApprovalNote}</p>
          </div>
        )}

        {}
        <div className="flex gap-2 justify-end pb-4">
          {canSubmit && (
            <Button
              variant="bordered"
              size="md"
              radius="md"
              startContent={<Send />}
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
                startContent={<X />}
                onPress={rejectModal.onOpen}
              >
                ไม่อนุมัติ
              </Button>
              <Button
                variant="bordered"
                color="success"
                size="md"
                radius="md"
                startContent={<Check />}
                onPress={() => handleAction("approve")}
                isLoading={saving}
              >
                อนุมัติ
              </Button>
            </>
          )}
          {canConfirmPayment && (
            <Button
              variant="bordered"
              size="md"
              radius="md"
              startContent={<Banknote />}
              onPress={() => handleAction("confirm_payment")}
              isLoading={saving}
            >
              ยืนยันชำระเงิน
            </Button>
          )}
        </div>
      </div>

      {}
      <Modal isOpen={rejectModal.isOpen} onClose={rejectModal.onClose} size="md">
        <ModalContent>
          <ModalHeader>เหตุผลที่ไม่อนุมัติ</ModalHeader>
          <ModalBody>
            <Textarea
              variant="bordered"
              size="md"
              radius="md"
              placeholder="ระบุเหตุผล..."
              value={rejectNote}
              onValueChange={setRejectNote}
              minRows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={rejectModal.onClose}>
              ยกเลิก
            </Button>
            <Button
              color="danger"
              size="md"
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
