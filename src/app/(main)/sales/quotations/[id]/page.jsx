"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Button,
  Input,
  Textarea,
  Chip,
  Spinner,
  Card,
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
import { useCrmQuotationEditor } from "@/hooks/useCrmQuotationEditor";

const STATUS_COLOR_MAP = {
  draft: "default",
  submitted: "primary",
  approved: "success",
  rejected: "danger",
  converted: "secondary",
};

export default function QuotationEditorPage() {
  const params = useParams();
  const quotationId = params.id;
  const router = useRouter();
  const {
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
  } = useCrmQuotationEditor(quotationId);
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
        Quotation not found
      </div>
    );
  }

  const status = quotation.quotationStatus || "draft";
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
            variant="light"
            size="sm"
            radius="md"
            onPress={() => router.push("/sales/quotations")}
          >
            <ArrowLeft size={18} />
          </Button>
          <h2 className="text-lg font-semibold">
            {quotation.quotationNo || "New Quotation"}
          </h2>
          <Chip size="sm" variant="flat" color={statusColor}>
            {status}
          </Chip>
        </div>
        <div className="flex items-center gap-2">
          {canSubmit && (
            <Button
              variant="bordered"
              size="md"
              radius="md"
              startContent={<Send size={14} />}
              onPress={() => handleAction("submit")}
              isLoading={saving}
            >
              Submit for Approval
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
              Save
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
                Reject
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                startContent={<Check size={14} />}
                onPress={() => handleAction("approve")}
                isLoading={saving}
              >
                Approve
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
              Convert to Order
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Quotation Info */}
        <Card className="p-4">
          <p className="text-lg font-semibold mb-4">Quotation Info</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <Input
                label="Valid Until"
                labelPlacement="outside"
                type="date"
                variant="bordered"
                size="md"
                radius="md"
                value={quotation.quotationValidUntil || ""}
                onChange={(e) =>
                  updateQuotationField("quotationValidUntil", e.target.value)
                }
                isReadOnly={!canEdit}
              />
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <Input
                label="Contact ID"
                labelPlacement="outside"
                placeholder="Enter contact ID"
                variant="bordered"
                size="md"
                radius="md"
                value={quotation.quotationContactId || ""}
                onChange={(e) =>
                  updateQuotationField("quotationContactId", e.target.value)
                }
                isReadOnly={!canEdit}
              />
            </div>
            <div className="flex items-center w-full h-fit p-2 gap-2">
              <Input
                label="Account ID"
                labelPlacement="outside"
                placeholder="Enter account ID"
                variant="bordered"
                size="md"
                radius="md"
                value={quotation.quotationAccountId || ""}
                onChange={(e) =>
                  updateQuotationField("quotationAccountId", e.target.value)
                }
                isReadOnly={!canEdit}
              />
            </div>
          </div>
        </Card>

        {/* Line Items */}
        <Card className="p-4">
          <p className="text-lg font-semibold mb-4">Line Items</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default-200">
                  <th className="text-left p-2 w-10">#</th>
                  <th className="text-left p-2">Product</th>
                  <th className="text-left p-2">Description</th>
                  <th className="text-right p-2 w-24">Qty</th>
                  <th className="text-right p-2 w-32">Unit Price</th>
                  <th className="text-right p-2 w-28">Discount</th>
                  <th className="text-right p-2 w-32">Amount</th>
                  {canEdit && <th className="text-center p-2 w-16">Action</th>}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr
                    key={index}
                    className="border-b border-default-100"
                  >
                    <td className="p-2 text-default-500">{index + 1}</td>
                    <td className="p-2">
                      {canEdit ? (
                        <Input
                          variant="bordered"
                          size="md"
                          radius="md"
                          value={line.lineProductName || ""}
                          onChange={(e) =>
                            updateLine(index, "lineProductName", e.target.value)
                          }
                        />
                      ) : (
                        line.lineProductName || "-"
                      )}
                    </td>
                    <td className="p-2">
                      {canEdit ? (
                        <Input
                          variant="bordered"
                          size="md"
                          radius="md"
                          value={line.lineDescription || ""}
                          onChange={(e) =>
                            updateLine(index, "lineDescription", e.target.value)
                          }
                        />
                      ) : (
                        line.lineDescription || "-"
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
                          value={String(line.lineQuantity || "")}
                          onChange={(e) =>
                            updateLine(
                              index,
                              "lineQuantity",
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      ) : (
                        <span className="block text-right">
                          {line.lineQuantity}
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
                          value={String(line.lineUnitPrice || "")}
                          onChange={(e) =>
                            updateLine(
                              index,
                              "lineUnitPrice",
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      ) : (
                        <span className="block text-right">
                          {(line.lineUnitPrice || 0).toLocaleString("th-TH", {
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
                          value={String(line.lineDiscount || "")}
                          onChange={(e) =>
                            updateLine(
                              index,
                              "lineDiscount",
                              Number(e.target.value) || 0,
                            )
                          }
                        />
                      ) : (
                        <span className="block text-right">
                          {(line.lineDiscount || 0).toLocaleString("th-TH", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </td>
                    <td className="p-2">
                      <span className="block text-right font-medium">
                        {(line.lineAmount || 0).toLocaleString("th-TH", {
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
                Add Line
              </Button>
            </div>
          )}
        </Card>

        {/* Summary */}
        <Card className="p-4">
          <p className="text-lg font-semibold mb-4">Summary</p>
          <div className="flex flex-col items-end gap-3 w-full max-w-sm ml-auto">
            <div className="flex items-center justify-between w-full">
              <span className="text-default-500">Subtotal</span>
              <span>
                ฿
                {calcSubtotal().toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex items-center justify-between w-full gap-4">
              <span className="text-default-500">Discount</span>
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
              <span className="text-default-500">Tax</span>
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
            <div className="flex items-center justify-between w-full border-t border-default-200 pt-2">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg">
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
          <p className="text-lg font-semibold mb-4">Notes & Terms</p>
          <div className="flex flex-col gap-4">
            <Textarea
              label="Notes"
              labelPlacement="outside"
              variant="bordered"
              radius="md"
              size="md"
              minRows={2}
              placeholder="Enter notes..."
              value={quotation.quotationNotes || ""}
              onValueChange={(v) => updateQuotationField("quotationNotes", v)}
              isReadOnly={!canEdit}
            />
            <Textarea
              label="Terms"
              labelPlacement="outside"
              variant="bordered"
              radius="md"
              size="md"
              minRows={2}
              placeholder="Enter terms..."
              value={quotation.quotationTerms || ""}
              onValueChange={(v) => updateQuotationField("quotationTerms", v)}
              isReadOnly={!canEdit}
            />
          </div>
        </Card>

        {/* Approval Info */}
        {quotation.quotationApprovalNote && (
          <div className="p-3 bg-danger-50 rounded-lg border border-danger-200">
            <p className="text-sm font-semibold text-danger mb-1">
              Rejection Note:
            </p>
            <p className="text-sm">{quotation.quotationApprovalNote}</p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal isOpen={rejectModal.isOpen} onClose={rejectModal.onClose} size="md">
        <ModalContent>
          <ModalHeader>Reject Quotation</ModalHeader>
          <ModalBody>
            <Textarea
              variant="bordered"
              radius="md"
              size="md"
              placeholder="Enter rejection note..."
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
              Cancel
            </Button>
            <Button
              variant="bordered"
              size="md"
              radius="md"
              onPress={onReject}
              isLoading={saving}
            >
              Reject
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
