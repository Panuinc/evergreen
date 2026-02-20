"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { Printer } from "lucide-react";
import { toast } from "sonner";
import { printRfidLabels } from "@/lib/qzPrinter";

export default function PrintRfidModal({ isOpen, onClose, item }) {
  const [quantity, setQuantity] = useState("");
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setQuantity(String(Math.max(Number(item.inventory) || 0, 1)));
    }
  }, [isOpen, item]);

  const handlePrint = async () => {
    const qty = Number(quantity);
    if (!qty || qty < 1) {
      toast.error("กรุณาระบุจำนวนที่ต้องการพิมพ์");
      return;
    }

    setPrinting(true);
    try {
      await printRfidLabels(null, item, qty);
      toast.success(`พิมพ์ RFID ${qty} ใบ สำเร็จ`);
      onClose();
    } catch (err) {
      toast.error(`พิมพ์ไม่สำเร็จ: ${err.message || err}`);
    } finally {
      setPrinting(false);
    }
  };

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Printer size={20} />
          พิมพ์ RFID Label
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-default-50 p-3 text-sm">
              <p className="font-semibold">{item.number}</p>
              <p className="text-default-500">{item.displayName}</p>
              <p className="text-default-400">
                คงเหลือ: {Number(item.inventory || 0).toLocaleString("th-TH")}
              </p>
            </div>

            <Input
              type="number"
              label="จำนวนที่พิมพ์"
              min={1}
              value={quantity}
              onValueChange={setQuantity}
            />

            <p className="text-xs text-default-400">
              RFID จะเขียนข้อมูล: รหัสสินค้า + ลำดับชิ้น (1/{quantity} ถึง{" "}
              {quantity}/{quantity})
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            ยกเลิก
          </Button>
          <Button
            color="primary"
            onPress={handlePrint}
            isLoading={printing}
            isDisabled={!quantity}
            startContent={!printing && <Printer size={16} />}
          >
            พิมพ์ {quantity} ใบ
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
