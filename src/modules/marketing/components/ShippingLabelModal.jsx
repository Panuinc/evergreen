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
import { Printer, Send } from "lucide-react";
import JsBarcode from "jsbarcode";

const SENDER = {
  name: "บริษัท ชื้อฮะฮวด อุตสาหกรรม จำกัด",
  address: "9/1 หมู่ 2 ถนนบางเลน-ลาดหลมแก้ว ต.ขนศรี อ.ไทรน้อย จ.นนทบุรี 11150",
  phone: "02-921-9979, 062-539-9980",
};

function buildLabelHTML(data, label, barcodeValue) {
  const phone = data.recipient.phone
    ? `<div><span style="color:#555">โทร: </span><strong>${data.recipient.phone}</strong></div>`
    : "";
  return `<div style="width:100mm;height:150mm;padding:3mm;box-sizing:border-box;display:flex;flex-direction:column;font-family:'Sarabun','Noto Sans Thai',sans-serif;color:#000;background-color:#fff">
  <div style="display:flex;border:1px solid #000;margin-bottom:2mm">
    <div style="width:18mm;display:flex;align-items:center;justify-content:center;padding:2mm;border-right:1px solid #000;flex-shrink:0">
      <img src="/logo/logo-03.png" crossorigin="anonymous" style="width:14mm;height:14mm;object-fit:contain">
    </div>
    <div style="flex:1;padding:2mm 2mm;font-size:6pt;line-height:1.5">
      <div style="margin-bottom:0.5mm"><span style="color:#555">ผู้ส่ง: </span><strong style="font-size:6.5pt">${SENDER.name}</strong></div>
      <div><span style="color:#555">ที่อยู่: </span>${SENDER.address}</div>
      <div><span style="color:#555">โทร: </span>${SENDER.phone}</div>
    </div>
    <div style="width:16mm;display:flex;align-items:center;justify-content:center;border-left:1px solid #000;flex-shrink:0">
      <div style="font-size:13pt;font-weight:bold;text-align:center;line-height:1.1">${label.runningNo}/${label.total}</div>
    </div>
  </div>
  <div style="padding:1mm;margin-bottom:2mm;text-align:center;display:flex;align-items:center;justify-content:center;min-height:20mm">
    <svg class="js-barcode" style="max-width:100%;max-height:20mm"></svg>
  </div>
  <div style="border:1px solid #000;padding:2mm 2.5mm;margin-bottom:2mm;font-size:7pt;line-height:1.6">
    <div><span style="color:#555">ผู้รับ: </span><strong style="font-size:10pt">${data.recipient.name}</strong></div>
    <div><span style="color:#555">ที่อยู่: </span>${data.recipient.address}</div>
    ${phone}
  </div>
  <div style="border:1px solid #000;margin-bottom:2mm;flex:1;overflow:hidden">
    <table style="width:100%;border-collapse:collapse;font-size:6.5pt">
      <thead><tr style="border-bottom:1px solid #000">
        <th style="padding:1mm 1.5mm;text-align:left;border-right:1px solid #000;font-weight:600">รายการสินค้า</th>
        <th style="padding:1mm 1.5mm;text-align:center;width:12mm;font-weight:600">จำนวน</th>
      </tr></thead>
      <tbody><tr style="border-bottom:1px solid #e5e5e5">
        <td style="padding:1mm 1.5mm;border-right:1px solid #ccc;font-weight:bold">${label.item.description}</td>
        <td style="padding:1mm 1.5mm;text-align:center;font-weight:bold">${label.item.qty}</td>
      </tr></tbody>
    </table>
  </div>
  <div style="border:1px solid #000;padding:2mm 2.5mm;display:flex;align-items:center;gap:2mm">
    <div style="flex:1;font-size:7pt;line-height:1.7">
      <div style="font-weight:bold;font-size:7.5pt">! กรุณาถ่ายวิดีโอขณะแกะพัสดุ</div>
      <div>เพื่อใช้เป็นหลักฐานการเคลมสินค้า</div>
      <div>ไม่มีหลักฐานงดเคลมทุกกรณี</div>
    </div>
    <div style="flex-shrink:0;text-align:center">
      <img src="/qrCode/lineEvergreen.png" crossorigin="anonymous" style="width:48px;height:48px;object-fit:contain">
      <div style="font-size:5.5pt;margin-top:1mm;font-weight:bold">LINE</div>
    </div>
  </div>
</div>`;
}

export default function ShippingLabelModal({ isOpen, onClose, order, customerPhone }) {
  const lines = order?.lines?.filter((l) => l.bcSalesOrderLineType === "Item" && l.bcSalesOrderLineQuantity > 0) || [];

  const [selectedLines, setSelectedLines] = useState(() =>
    Object.fromEntries(lines.map((l) => [l.bcSalesOrderLineNo, true])),
  );
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(lines.map((l) => [l.bcSalesOrderLineNo, l.bcSalesOrderLineOutstandingQuantity || l.bcSalesOrderLineQuantity || 0])),
  );
  const [recipientName, setRecipientName] = useState(
    order?.bcSalesOrderShipToName || order?.bcSalesOrderCustomerName || "",
  );
  const [recipientAddress, setRecipientAddress] = useState(
    [order?.bcSalesOrderShipToAddress || order?.bcSalesOrderSellToAddress, order?.bcSalesOrderShipToCity || order?.bcSalesOrderSellToCity, order?.bcSalesOrderShipToPostCode || order?.bcSalesOrderSellToPostCode]
      .filter(Boolean)
      .join(" ") || "",
  );
  const [recipientPhone, setRecipientPhone] = useState(customerPhone || "");

  const totalLabels = useMemo(() => {
    return lines.reduce((sum, l) => {
      if (!selectedLines[l.bcSalesOrderLineNo]) return sum;
      return sum + (quantities[l.bcSalesOrderLineNo] || 0);
    }, 0);
  }, [lines, selectedLines, quantities]);

  const handleToggle = (lineNo) => {
    setSelectedLines((prev) => ({ ...prev, [lineNo]: !prev[lineNo] }));
  };

  const handleQtyChange = (lineNo, value) => {
    const num = Math.max(0, parseInt(value) || 0);
    setQuantities((prev) => ({ ...prev, [lineNo]: num }));
  };

  const [networkPrinting, setNetworkPrinting] = useState(false);
  const [networkResult, setNetworkResult] = useState(null);

  const buildLabelData = () => {
    const items = lines
      .filter((l) => selectedLines[l.bcSalesOrderLineNo] && quantities[l.bcSalesOrderLineNo] > 0)
      .map((l) => ({
        description: l.bcSalesOrderLineDescription || l.bcSalesOrderLineObjectNumber,
        itemNo: l.bcSalesOrderLineObjectNumber,
        qty: quantities[l.bcSalesOrderLineNo],
        uom: l.bcSalesOrderLineUnitOfMeasureCode || "PCS",
      }));

    if (items.length === 0) return null;

    return {
      orderNo: order.bcSalesOrderNumber,
      externalDocNo: order.bcSalesOrderExternalDocumentNumber || "",
      recipient: {
        name: recipientName,
        address: recipientAddress,
        phone: recipientPhone,
      },
      items,
      totalLabels: items.reduce((s, i) => s + i.qty, 0),
    };
  };

  const handlePrint = () => {
    const data = buildLabelData();
    if (!data) return;

    const key = `shipping-label-${order.bcSalesOrderNumber}`;
    localStorage.setItem(key, JSON.stringify(data));
    window.open(`/marketing/shippingLabel/${encodeURIComponent(order.bcSalesOrderNumber)}`, "_blank");
    onClose();
  };

  const handleNetworkPrint = async () => {
    const data = buildLabelData();
    if (!data) return;

    setNetworkPrinting(true);
    setNetworkResult(null);

    try {
      const html2canvas = (await import("html2canvas")).default;

      // Build label list (same logic as ShippingLabelDocument)
      const labels = [];
      let runningNo = 0;
      for (const item of data.items) {
        for (let i = 0; i < item.qty; i++) {
          runningNo++;
          labels.push({ runningNo, total: data.totalLabels, item });
        }
      }

      // Hidden container for rendering
      const container = document.createElement("div");
      container.style.cssText = "position:fixed;left:-9999px;top:0;z-index:-1;";
      document.body.appendChild(container);

      const images = [];

      for (const label of labels) {
        const barcodeValue = `${data.orderNo}-${String(label.runningNo).padStart(2, "0")}-${label.total}`;

        container.innerHTML = buildLabelHTML(data, label, barcodeValue);
        const labelEl = container.firstChild;

        // Generate barcode (same settings as ShippingLabelDocument)
        const svgEl = labelEl.querySelector(".js-barcode");
        if (svgEl) {
          JsBarcode(svgEl, barcodeValue, {
            format: "CODE128",
            width: 1.3,
            height: 38,
            displayValue: true,
            fontSize: 7,
            margin: 2,
            background: "#ffffff",
            lineColor: "#000000",
          });
        }

        // Wait for images to load
        const imgs = labelEl.querySelectorAll("img");
        await Promise.all(
          Array.from(imgs).map(
            (img) =>
              new Promise((resolve) => {
                if (img.complete) resolve();
                else {
                  img.onload = resolve;
                  img.onerror = resolve;
                }
              }),
          ),
        );

        const canvas = await html2canvas(labelEl, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        });

        images.push(canvas.toDataURL("image/png").split(",")[1]);
      }

      document.body.removeChild(container);

      // Send captured images to server for TSPL conversion + printing
      const res = await fetch("/api/marketing/shippingLabel/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      const result = await res.json();
      if (result.success) {
        setNetworkResult({ type: "success", message: `ส่งพิมพ์สำเร็จ ${result.data.summary.success}/${result.data.summary.total} ใบ` });
      } else {
        setNetworkResult({ type: "error", message: result.error || "ส่งพิมพ์ไม่สำเร็จ" });
      }
    } catch (err) {
      setNetworkResult({ type: "error", message: err.message });
    } finally {
      setNetworkPrinting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <span>พิมพ์ใบปะหน้าส่งสินค้า</span>
          <span className="text-xs font-light text-muted-foreground">{order?.bcSalesOrderNumber}</span>
        </ModalHeader>
        <ModalBody className="gap-6">
          {/* Recipient Info */}
          <div className="space-y-3">
            <p className="text-xs font-light">ข้อมูลผู้รับ</p>
            <Input
              label="ชื่อผู้รับ"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              value={recipientName}
              onValueChange={setRecipientName}
            />
            <Textarea
              label="ที่อยู่"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              minRows={2}
              value={recipientAddress}
              onValueChange={setRecipientAddress}
            />
            <Input
              label="เบอร์โทร"
              labelPlacement="outside"
              variant="bordered"
              size="md"
              radius="md"
              value={recipientPhone}
              onValueChange={setRecipientPhone}
            />
          </div>

          {/* Line Items Selection */}
          <div className="space-y-3">
            <p className="text-xs font-light">เลือกรายการสินค้า</p>
            <div className="space-y-2">
              {lines.map((l) => (
                <div
                  key={l.bcSalesOrderLineNo}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border"
                >
                  <Checkbox
                    isSelected={selectedLines[l.bcSalesOrderLineNo] || false}
                    onValueChange={() => handleToggle(l.bcSalesOrderLineNo)}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-light truncate">
                      {l.bcSalesOrderLineDescription || l.bcSalesOrderLineObjectNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      สั่ง {l.bcSalesOrderLineQuantity} / ส่งแล้ว {l.bcSalesOrderLineQuantityShipped || 0} / คงค้าง{" "}
                      {l.bcSalesOrderLineOutstandingQuantity || 0} {l.bcSalesOrderLineUnitOfMeasureCode}
                    </p>
                  </div>
                  <Input
                    type="number"
                    variant="bordered"
                    size="md"
                    radius="md"
                    className="w-20"
                    min={0}
                    max={l.bcSalesOrderLineQuantity}
                    value={String(quantities[l.bcSalesOrderLineNo] || 0)}
                    onValueChange={(v) => handleQtyChange(l.bcSalesOrderLineNo, v)}
                    isDisabled={!selectedLines[l.bcSalesOrderLineNo]}
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {l.bcSalesOrderLineUnitOfMeasureCode || "PCS"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="flex flex-col gap-2">
          {networkResult && (
            <div
              className={`w-full text-xs px-3 py-2 rounded-lg ${
                networkResult.type === "success"
                  ? "bg-success-50 text-success-700"
                  : "bg-danger-50 text-danger-700"
              }`}
            >
              {networkResult.message}
            </div>
          )}
          <div className="flex items-center justify-between w-full">
            <p className="text-xs text-muted-foreground">
              จำนวนใบปะหน้า: <span className="font-light text-foreground">{totalLabels}</span> ใบ
            </p>
            <div className="flex gap-2">
              <Button variant="bordered" size="md" radius="md" onPress={onClose}>
                ยกเลิก
              </Button>
              <Button
                variant="bordered"
                size="md"
                radius="md"
                startContent={<Printer />}
                onPress={handlePrint}
                isDisabled={totalLabels === 0}
              >
                พิมพ์ (เบราว์เซอร์)
              </Button>
              <Button
                color="primary"
                size="md"
                radius="md"
                startContent={<Send />}
                onPress={handleNetworkPrint}
                isDisabled={totalLabels === 0 || networkPrinting}
                isLoading={networkPrinting}
              >
                ส่งพิมพ์
              </Button>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
