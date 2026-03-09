"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Chip,  Card,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  ArrowLeft,
  Send,
  Check,
  X,
  Plus,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import Loading from "@/components/ui/Loading";

const STATUS_COLOR_MAP = {
  draft: "default",
  submitted: "primary",
  approved: "success",
  rejected: "danger",
  converted: "secondary",
};

export default function QuotationEditorView({
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
  onNavigateBack,
}) {
  const [rejectNote, setRejectNote] = useState("");
  const rejectModal = useDisclosure();

  const onReject = async () => {
    await handleAction("reject", rejectNote);
    rejectModal.onClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading />
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        ไม่พบใบเสนอราคา
      </div>
    );
  }

  const status = quotation.crmQuotationStatus || "draft";
  const statusColor = STATUS_COLOR_MAP[status] || "default";
  const canEdit = ["draft", "rejected"].includes(status);
  const canSubmit = canEdit;
  const canApprove = status === "submitted";
  const canConvert = status === "approved";

  return (
    <div className="flex flex-col w-full h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="bordered"
            size="md"
            radius="md"
            onPress={onNavigateBack}
          >
            <ArrowLeft size={18} />
          </Button>
          <p className="text-xs font-light">
            {quotation.crmQuotationNo || "ใบเสนอราคาใหม่"}
          </p>
          <Chip variant="flat" size="md" radius="md" color={statusColor}>
            {status}
          </Chip>
        </div>
        <div className="flex items-center gap-2">
          {canSubmit && (
            <Button
              variant="flat"
              size="md"
              radius="md"
              startContent={<Send size={14} />}
              onPress={() => handleAction("submit")}
              isLoading={saving}
            >
              ส่งเพื่ออนุมัติ
            </Button>
          )}
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
          {canApprove && (
            <>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                startContent={<X size={14} />}
                onPress={rejectModal.onOpen}
              >
                ปฏิเสธ
              </Button>
              <Button
                variant="bordered"
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
          {canConvert && (
            <Button
              variant="bordered"
              size="md"
              radius="md"
              startContent={<ShoppingCart size={14} />}
              onPress={() => handleAction("convert_order")}
              isLoading={saving}
            >
              แปลงเป็นคำสั่งซื้อ
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Quotation Info */}
        <Card className="p-4">
          <p className="text-xs font-light mb-4">ข้อมูลใบเสนอราคา</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <Input
                label="ใช้ได้ถึง"
                labelPlacement="outside"
                type="date"
                variant="bordered"
                size="md"
                radius="md"
                value={quotation.crmQuotationValidUntil || ""}
                onChange={(e) =>
                  updateQuotationField("crmQuotationValidUntil", e.target.value)
                }
                isReadOnly={!canEdit}
              />
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <Input
                label="รหัสผู้ติดต่อ"
                labelPlacement="outside"
                placeholder="ใส่รหัสผู้ติดต่อ"
                variant="bordered"
                size="md"
                radius="md"
                value={quotation.crmQuotationContactId || ""}
                onChange={(e) =>
                  updateQuotationField("crmQuotationContactId", e.target.value)
                }
                isReadOnly={!canEdit}
              />
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <Input
                label="รหัสบัญชี"
                labelPlacement="outside"
                placeholder="ใส่รหัสบัญชี"
                variant="bordered"
                size="md"
                radius="md"
                value={quotation.crmQuotationAccountId || ""}
                onChange={(e) =>
                  updateQuotationField("crmQuotationAccountId", e.target.value)
                }
                isReadOnly={!canEdit}
              />
            </div>
          </div>
        </Card>

        {/* Line Items */}
        <Card className="p-4">
          <p className="text-xs font-light mb-4">รายการสินค้า</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 w-10">#</th>
                  <th className="text-left p-2">สินค้า</th>
                  <th className="text-left p-2">รายละเอียด</th>
                  <th className="text-right p-2 w-24">จำนวน</th>
                  <th className="text-right p-2 w-32">ราคาต่อหน่วย</th>
                  <th className="text-right p-2 w-28">ส่วนลด</th>
                  <th className="text-right p-2 w-32">จำนวนเงิน</th>
                  {canEdit && <th className="text-center p-2 w-16">การดำเนินการ</th>}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr
                    key={index}
                    className="border-b border-border"
                  >
                    <td className="p-2 text-muted-foreground">{index + 1}</td>
                    <td className="p-2">
                      {canEdit ? (
                        <Input
                          variant="bordered"
                          size="md"
                          radius="md"
                          value={line.crmQuotationLineProductName || ""}
                          onChange={(e) =>
                            updateLine(index, "crmQuotationLineProductName", e.target.value)
                          }
                        />
                      ) : (
                        line.crmQuotationLineProductName || "-"
                      )}
                    </td>
                    <td className="p-2">
                      {canEdit ? (
                        <Input
                          variant="bordered"
                          size="md"
                          radius="md"
                          value={line.crmQuotationLineDescription || ""}
                          onChange={(e) =>
                            updateLine(index, "crmQuotationLineDescription", e.target.value)
                          }
                        />
                      ) : (
                        line.crmQuotationLineDescription || "-"
                      )}
                    </td>
                    <td className="p-2">
                      {canEdit ? (
                        <Input
                          variant="bordered"
                          size="md"
                          radius="md"
                          type="number"
                          classNames={{ input: "text-right" }}
                          value={String(line.crmQuotationLineQuantity || "")}
                          onChange={(e) =>
                            updateLine(
                              index,
                              "crmQuotationLineQuantity",
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      ) : (
                        <span className="block text-right">
                          {line.crmQuotationLineQuantity}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      {canEdit ? (
                        <Input
                          variant="bordered"
                          size="md"
                          radius="md"
                          type="number"
                          classNames={{ input: "text-right" }}
                          value={String(line.crmQuotationLineUnitPrice || "")}
                          onChange={(e) =>
                            updateLine(
                              index,
                              "crmQuotationLineUnitPrice",
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      ) : (
                        <span className="block text-right">
                          {(line.crmQuotationLineUnitPrice || 0).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      {canEdit ? (
                        <Input
                          variant="bordered"
                          size="md"
                          radius="md"
                          type="number"
                          classNames={{ input: "text-right" }}
                          value={String(line.crmQuotationLineDiscount || "")}
                          onChange={(e) =>
                            updateLine(
                              index,
                              "crmQuotationLineDiscount",
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      ) : (
                        <span className="block text-right">
                          {(line.crmQuotationLineDiscount || 0).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <span className="block text-right font-light">
                        {(line.crmQuotationLineAmount || 0).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="p-2 text-center">
                        <Button
                          variant="bordered"
                          size="md"
                          radius="md"
                          isIconOnly
                          onPress={() => removeLine(index)}
                        >
                          <X size={14} />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {canEdit && (
            <div className="mt-3">
              <Button
                variant="bordered"
                size="md"
                radius="md"
                startContent={<Plus size={14} />}
                onPress={addLine}
              >
                เพิ่มรายการ
              </Button>
            </div>
          )}
        </Card>

        {/* Summary */}
        <Card className="p-4">
          <p className="text-xs font-light mb-4">สรุป</p>
          <div className="flex flex-col items-end gap-3 w-full max-w-sm ml-auto">
            <div className="flex items-center justify-between w-full">
              <span className="text-muted-foreground">ยอดรวมย่อย</span>
              <span>
                ฿
                {calcSubtotal().toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between w-full gap-4">
              <span className="text-muted-foreground">ส่วนลด</span>
              <Input
                variant="bordered"
                size="md"
                radius="md"
                type="number"
                classNames={{ input: "text-right" }}
                className="max-w-[150px]"
                value={String(discount)}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                isReadOnly={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between w-full gap-4">
              <span className="text-muted-foreground">ภาษี</span>
              <Input
                variant="bordered"
                size="md"
                radius="md"
                type="number"
                classNames={{ input: "text-right" }}
                className="max-w-[150px]"
                value={String(tax)}
                onChange={(e) => setTax(Number(e.target.value) || 0)}
                isReadOnly={!canEdit}
              />
            </div>
            <div className="flex items-center justify-between w-full border-t border-border pt-2">
              <span className="font-light text-xs">ยอดรวม</span>
              <span className="font-light text-xs">
                ฿
                {calcTotal().toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </Card>

        {/* Notes & Terms */}
        <Card className="p-4">
          <p className="text-xs font-light mb-4">หมายเหตุและเงื่อนไข</p>
          <div className="flex flex-col gap-4">
            <Textarea
              label="หมายเหตุ"
              labelPlacement="outside"
              variant="bordered"
              radius="md"
              size="md"
              minRows={2}
              placeholder="ใส่หมายเหตุ..."
              value={quotation.crmQuotationNotes || ""}
              onValueChange={(v) => updateQuotationField("crmQuotationNotes", v)}
              isReadOnly={!canEdit}
            />
            <Textarea
              label="เงื่อนไข"
              labelPlacement="outside"
              variant="bordered"
              radius="md"
              size="md"
              minRows={2}
              placeholder="ใส่เงื่อนไข..."
              value={quotation.crmQuotationTerms || ""}
              onValueChange={(v) => updateQuotationField("crmQuotationTerms", v)}
              isReadOnly={!canEdit}
            />
          </div>
        </Card>

        {/* Approval Info */}
        {quotation.crmQuotationApprovalNote && (
          <div className="p-3 bg-danger-50 rounded-lg border border-danger-200">
            <p className="text-xs font-light text-danger mb-1">
              หมายเหตุการปฏิเสธ:
            </p>
            <p className="text-xs">{quotation.crmQuotationApprovalNote}</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal.isOpen} onClose={rejectModal.onClose} size="md">
        <ModalContent>
          <ModalHeader>ปฏิเสธใบเสนอราคา</ModalHeader>
          <ModalBody>
            <Textarea
              variant="bordered"
              radius="md"
              size="md"
              placeholder="ใส่หมายเหตุการปฏิเสธ..."
              value={rejectNote}
              onValueChange={setRejectNote}
              minRows={3}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={rejectModal.onClose}
            >
              ยกเลิก
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={onReject}
              isLoading={saving}
            >
              ปฏิเสธ
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
