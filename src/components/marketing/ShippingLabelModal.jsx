"use client";

import { useState, useMemo } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Checkbox,
  Textarea,
} from "@heroui/react";
import { Printer } from "lucide-react";

export default function ShippingLabelModal({ isOpen, onClose, order, customerPhone }) {
  const lines = order?.lines?.filter((l) => l.Type === "Item" && l.Quantity > 0) || [];

  const [selectedLines, setSelectedLines] = useState(() =>
    Object.fromEntries(lines.map((l) => [l.Line_No, true])),
  );
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(lines.map((l) => [l.Line_No, l.BWK_Outstanding_Quantity || l.Quantity || 0])),
  );
  const [recipientName, setRecipientName] = useState(
    order?.Ship_to_Name || order?.Sell_to_Customer_Name || "",
  );
  const [recipientAddress, setRecipientAddress] = useState(
    [order?.Ship_to_Address || order?.Sell_to_Address, order?.Ship_to_City || order?.Sell_to_City, order?.Ship_to_Post_Code || order?.Sell_to_Post_Code]
      .filter(Boolean)
      .join(" ") || "",
  );
  const [recipientPhone, setRecipientPhone] = useState(customerPhone || "");

  const totalLabels = useMemo(() => {
    return lines.reduce((sum, l) => {
      if (!selectedLines[l.Line_No]) return sum;
      return sum + (quantities[l.Line_No] || 0);
    }, 0);
  }, [lines, selectedLines, quantities]);

  const handleToggle = (lineNo) => {
    setSelectedLines((prev) => ({ ...prev, [lineNo]: !prev[lineNo] }));
  };

  const handleQtyChange = (lineNo, value) => {
    const num = Math.max(0, parseInt(value) || 0);
    setQuantities((prev) => ({ ...prev, [lineNo]: num }));
  };

  const handlePrint = () => {
    const items = lines
      .filter((l) => selectedLines[l.Line_No] && quantities[l.Line_No] > 0)
      .map((l) => ({
        description: l.Description || l.No,
        itemNo: l.No,
        qty: quantities[l.Line_No],
        uom: l.Unit_of_Measure_Code || "PCS",
      }));

    if (items.length === 0) return;

    const data = {
      orderNo: order.No,
      externalDocNo: order.External_Document_No || "",
      recipient: {
        name: recipientName,
        address: recipientAddress,
        phone: recipientPhone,
      },
      items,
      totalLabels: items.reduce((s, i) => s + i.qty, 0),
    };

    const key = `shipping-label-${order.No}`;
    sessionStorage.setItem(key, JSON.stringify(data));
    window.open(`/marketing/shippingLabel/${encodeURIComponent(order.No)}`, "_blank");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span>พิมพ์ใบปะหน้าส่งสินค้า</span>
          <span className="text-sm font-normal text-default-400">{order?.No}</span>
        </ModalHeader>
        <ModalBody className="gap-6">
          {/* Recipient Info */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">ข้อมูลผู้รับ</p>
            <Input
              label="ชื่อผู้รับ"
              variant="bordered"
              size="sm"
              radius="md"
              value={recipientName}
              onValueChange={setRecipientName}
            />
            <Textarea
              label="ที่อยู่"
              variant="bordered"
              size="sm"
              radius="md"
              minRows={2}
              value={recipientAddress}
              onValueChange={setRecipientAddress}
            />
            <Input
              label="เบอร์โทร"
              variant="bordered"
              size="sm"
              radius="md"
              value={recipientPhone}
              onValueChange={setRecipientPhone}
            />
          </div>

          {/* Line Items Selection */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">เลือกรายการสินค้า</p>
            <div className="space-y-2">
              {lines.map((l) => (
                <div
                  key={l.Line_No}
                  className="flex items-center gap-3 p-3 rounded-lg border border-default-200"
                >
                  <Checkbox
                    isSelected={selectedLines[l.Line_No] || false}
                    onValueChange={() => handleToggle(l.Line_No)}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {l.Description || l.No}
                    </p>
                    <p className="text-xs text-default-400">
                      สั่ง {l.Quantity} / ส่งแล้ว {l.Quantity_Shipped || 0} / คงค้าง{" "}
                      {l.BWK_Outstanding_Quantity || 0} {l.Unit_of_Measure_Code}
                    </p>
                  </div>
                  <Input
                    type="number"
                    variant="bordered"
                    size="sm"
                    radius="md"
                    className="w-20"
                    min={0}
                    max={l.Quantity}
                    value={String(quantities[l.Line_No] || 0)}
                    onValueChange={(v) => handleQtyChange(l.Line_No, v)}
                    isDisabled={!selectedLines[l.Line_No]}
                  />
                  <span className="text-xs text-default-400 w-8">
                    {l.Unit_of_Measure_Code || "PCS"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="flex items-center justify-between">
          <p className="text-sm text-default-500">
            จำนวนใบปะหน้า: <span className="font-bold text-foreground">{totalLabels}</span> ใบ
          </p>
          <div className="flex gap-2">
            <Button variant="bordered" radius="md" onPress={onClose}>
              ยกเลิก
            </Button>
            <Button
              color="primary"
              radius="md"
              startContent={<Printer size={16} />}
              onPress={handlePrint}
              isDisabled={totalLabels === 0}
            >
              พิมพ์
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
