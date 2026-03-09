"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Skeleton,
} from "@heroui/react";
import { Printer, Eye, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { printRfidLabels, previewLabel } from "@/lib/qzPrinter";

const MAX_BATCH = 99;

export default function PrintRfidModal({ isOpen, onClose, item }) {
  const [quantity, setQuantity] = useState("");
  const [printing, setPrinting] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    if (isOpen && item) {
      setQuantity(String(Math.max(Number(item.inventory) || 0, 1)));
      setPreviewSrc(null);
    }
  }, [isOpen, item]);

  const loadPreview = useCallback(async () => {
    if (!item) return;
    setLoadingPreview(true);
    try {
      const qty = Number(quantity) || 1;
      const res = await previewLabel(item, qty);
      setPreviewSrc(`data:image/png;base64,${res.preview}`);
    } catch {
      toast.error("ไม่สามารถโหลด preview ได้");
    } finally {
      setLoadingPreview(false);
    }
  }, [item, quantity]);

  useEffect(() => {
    if (isOpen && item) {
      loadPreview();
    }
  }, [isOpen, item, loadPreview]);

  const hasRfidCode = item?.rfidCode != null;
  const qty = Number(quantity) || 0;
  const isOverBatch = qty > MAX_BATCH;

  const handlePrint = async () => {
    if (!qty || qty < 1) {
      toast.error("กรุณาระบุจำนวนที่ต้องการพิมพ์");
      return;
    }

    if (!hasRfidCode) {
      toast.error("สินค้านี้ยังไม่ได้กำหนด RFID Code กรุณา assign ก่อนพิมพ์");
      return;
    }

    if (isOverBatch) {
      toast.error(`จำนวนต่อ batch ต้องไม่เกิน ${MAX_BATCH} ชิ้น`);
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
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Printer size={20} />
          พิมพ์ RFID Label
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-default-50 p-3 text-xs">
              <p className="font-light">{item.number}</p>
              <p className="text-muted-foreground">{item.displayName}</p>
              <p className="text-muted-foreground">
                คงเหลือ: {Number(item.inventory || 0).toLocaleString("th-TH")}
              </p>
              <p className={hasRfidCode ? "text-success-600" : "text-danger"}>
                RFID Code: {hasRfidCode ? item.rfidCode : "ยังไม่ได้กำหนด"}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-light text-foreground">
                ตัวอย่าง Label
              </p>
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-white p-3 min-h-20">
                {loadingPreview ? (
                  <Skeleton className="w-full h-15 rounded" />
                ) : previewSrc ? (
                  <img
                    src={previewSrc}
                    alt="Label preview"
                    className="max-w-full h-auto"
                    style={{ imageRendering: "pixelated" }}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">
                    กดปุ่มด้านล่างเพื่อดูตัวอย่าง
                  </p>
                )}
              </div>
              <Button
                size="md"
                variant="flat"
                radius="md"
                onPress={loadPreview}
                isLoading={loadingPreview}
                startContent={!loadingPreview && <Eye size={14} />}
              >
                รีเฟรช Preview
              </Button>
            </div>

            <Input
              type="number"
              label="จำนวนที่พิมพ์"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              min={1}
              value={quantity}
              onValueChange={setQuantity}
            />

            {!hasRfidCode && (
              <div className="flex items-center gap-2 rounded-lg bg-danger-50 p-3 text-xs text-danger">
                <AlertTriangle size={16} className="shrink-0" />
                <span>สินค้านี้ยังไม่ได้กำหนด RFID Code กรุณา assign ก่อนพิมพ์</span>
              </div>
            )}

            {isOverBatch && (
              <div className="flex items-center gap-2 rounded-lg bg-warning-50 p-3 text-xs text-warning-700">
                <AlertTriangle size={16} className="shrink-0" />
                <span>จำนวนต่อ batch ต้องไม่เกิน {MAX_BATCH} ชิ้น</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              RFID จะเขียนข้อมูล: RFID Code + ลำดับชิ้น (1/{quantity} ถึง{" "}
              {quantity}/{quantity})
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" size="md" radius="md" onPress={onClose}>
            ยกเลิก
          </Button>
          <Button
            color="primary"
            size="md"
            radius="md"
            onPress={handlePrint}
            isLoading={printing}
            isDisabled={!quantity || !hasRfidCode || isOverBatch}
            startContent={!printing && <Printer size={16} />}
          >
            พิมพ์ {quantity} ใบ
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
