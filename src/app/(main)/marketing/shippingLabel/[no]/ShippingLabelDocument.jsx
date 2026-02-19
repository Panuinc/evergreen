"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

const SENDER = {
  name: "บริษัท ชื้อฮะฮวด อุตสาหกรรม จำกัด",
  address: "9/1 หมู่ 2 ถนนบางเลน-ลาดหลมแก้ว ต.ขนศรี อ.ไทรน้อย จ.นนทบุรี 11150",
  phone: "02-921-9979, 062-539-9980",
};

function BarcodeImg({ value }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      JsBarcode(ref.current, value, {
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
  }, [value]);
  return <svg ref={ref} style={{ maxWidth: "100%", maxHeight: "20mm" }} />;
}

export default function ShippingLabelDocument({ orderNo }) {
  const key = `shipping-label-${orderNo}`;
  const raw = localStorage.getItem(key);
  const data = raw ? JSON.parse(raw) : null;
  const printed = useRef(false);

  useEffect(() => {
    if (data && !printed.current) {
      printed.current = true;
      setTimeout(() => window.print(), 500);
    }
  });

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen text-default-400">
        ไม่พบข้อมูล กรุณากลับไปหน้า Sales Order แล้วลองใหม่
      </div>
    );
  }

  const labels = [];
  let runningNo = 0;
  for (const item of data.items) {
    for (let i = 0; i < item.qty; i++) {
      runningNo++;
      labels.push({ runningNo, total: data.totalLabels, item });
    }
  }

  return (
    <div id="label-print-area">
      <style jsx global>{`
        @media print {
          @page {
            size: 100mm 150mm;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            margin: 0;
          }
          .no-print {
            display: none !important;
          }
          body * {
            visibility: hidden !important;
          }
          #label-print-area,
          #label-print-area * {
            visibility: visible !important;
          }
          #label-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
          }
        }
        @media screen {
          .label-page {
            margin: 16px auto;
            box-shadow: 0 0 12px rgba(0, 0, 0, 0.12);
          }
        }
      `}</style>

      {/* ปุ่มสำหรับหน้าจอ */}
      <div className="no-print flex items-center justify-between mb-4 px-4 pt-4">
        <p className="text-sm text-default-500">
          ใบปะหน้าส่งสินค้า — {data.orderNo} ({labels.length} ใบ)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            พิมพ์
          </button>
          <button
            onClick={() => window.close()}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium"
          >
            ปิด
          </button>
        </div>
      </div>

      {labels.map((label, idx) => {
        const barcodeValue = `${data.orderNo}-${String(label.runningNo).padStart(2, "0")}-${label.total}`;
        return (
          <div
            key={idx}
            className="label-page"
            style={{
              width: "100mm",
              height: "150mm",
              padding: "3mm",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif",
              color: "#000",
              backgroundColor: "#fff",
              pageBreakAfter: idx < labels.length - 1 ? "always" : "auto",
            }}
          >
            {/* ── ส่วนที่ 1: ผู้ส่ง + เลขกล่อง ── */}
            <div
              style={{
                display: "flex",
                border: "1px solid #000",
                marginBottom: "2mm",
              }}
            >
              {/* โลโก้ */}
              <div
                style={{
                  width: "18mm",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "2mm",
                  borderRight: "1px solid #000",
                  flexShrink: 0,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo/logo-01.png"
                  alt="Evergreen"
                  style={{
                    width: "14mm",
                    height: "14mm",
                    objectFit: "contain",
                  }}
                />
              </div>

              {/* ข้อมูลผู้ส่ง */}
              <div
                style={{
                  flex: 1,
                  padding: "2mm 2mm",
                  fontSize: "6pt",
                  lineHeight: "1.5",
                }}
              >
                <div style={{ marginBottom: "0.5mm" }}>
                  <span style={{ color: "#555" }}>ผู้ส่ง: </span>
                  <strong style={{ fontSize: "6.5pt" }}>{SENDER.name}</strong>
                </div>
                <div>
                  <span style={{ color: "#555" }}>ที่อยู่: </span>
                  {SENDER.address}
                </div>
                <div>
                  <span style={{ color: "#555" }}>โทร: </span>
                  {SENDER.phone}
                </div>
              </div>

              {/* เลขกล่อง */}
              <div
                style={{
                  width: "16mm",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderLeft: "1px solid #000",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: "13pt",
                    fontWeight: "bold",
                    textAlign: "center",
                    lineHeight: "1.1",
                  }}
                >
                  {label.runningNo}/{label.total}
                </div>
              </div>
            </div>

            {/* ── ส่วนที่ 2: Barcode ── */}
            <div
              style={{
                border: "0px dashed #aaa",
                padding: "1mm",
                marginBottom: "2mm",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "20mm",
              }}
            >
              <BarcodeImg value={barcodeValue} />
            </div>

            {/* ── ส่วนที่ 3: ผู้รับ ── */}
            <div
              style={{
                border: "1px solid #000",
                padding: "2mm 2.5mm",
                marginBottom: "2mm",
                fontSize: "7pt",
                lineHeight: "1.6",
              }}
            >
              <div>
                <span style={{ color: "#555" }}>ผู้รับ: </span>
                <strong style={{ fontSize: "10pt" }}>
                  {data.recipient.name}
                </strong>
              </div>
              <div>
                <span style={{ color: "#555" }}>ที่อยู่: </span>
                {data.recipient.address}
              </div>
              {data.recipient.phone && (
                <div>
                  <span style={{ color: "#555" }}>โทร: </span>
                  <strong>{data.recipient.phone}</strong>
                </div>
              )}
            </div>

            {/* ── ส่วนที่ 4: รายการสินค้า ── */}
            <div
              style={{
                border: "1px solid #000",
                marginBottom: "2mm",
                flex: 1,
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "6.5pt",
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid #000" }}>
                    <th
                      style={{
                        padding: "1mm 1.5mm",
                        textAlign: "center",
                        width: "8mm",
                        borderRight: "1px solid #000",
                        fontWeight: "600",
                      }}
                    >
                      Item
                    </th>
                    <th
                      style={{
                        padding: "1mm 1.5mm",
                        textAlign: "left",
                        borderRight: "1px solid #000",
                        fontWeight: "600",
                      }}
                    >
                      รายการสินค้า
                    </th>
                    <th
                      style={{
                        padding: "1mm 1.5mm",
                        textAlign: "center",
                        width: "12mm",
                        fontWeight: "600",
                      }}
                    >
                      จำนวน
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, i) => {
                    const isCurrentItem =
                      item.description === label.item.description &&
                      item.itemNo === label.item.itemNo;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #e5e5e5" }}>
                        <td
                          style={{
                            padding: "1mm 1.5mm",
                            textAlign: "center",
                            borderRight: "1px solid #ccc",
                            fontWeight: isCurrentItem ? "bold" : "normal",
                          }}
                        >
                          {i + 1}
                        </td>
                        <td
                          style={{
                            padding: "1mm 1.5mm",
                            borderRight: "1px solid #ccc",
                            fontWeight: isCurrentItem ? "bold" : "normal",
                            color: isCurrentItem ? "#000" : "#555",
                          }}
                        >
                          {item.description}
                        </td>
                        <td
                          style={{
                            padding: "1mm 1.5mm",
                            textAlign: "center",
                            fontWeight: isCurrentItem ? "bold" : "normal",
                            color: isCurrentItem ? "#000" : "#555",
                          }}
                        >
                          {item.qty}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── ส่วนที่ 5: ข้อความเตือน + QR Code ── */}
            <div
              style={{
                border: "1px solid #000",
                padding: "2mm 2.5mm",
                display: "flex",
                alignItems: "center",
                gap: "2mm",
              }}
            >
              <div style={{ flex: 1, fontSize: "7pt", lineHeight: "1.7" }}>
                <div style={{ fontWeight: "bold", fontSize: "7.5pt" }}>
                  ! กรุณาถ่ายวิดีโอขณะแกะพัสดุ
                </div>
                <div>เพื่อใช้เป็นหลักฐานการเคลมสินค้า</div>
                <div>ไม่มีหลักฐานงดเคลมทุกกรณี</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/qrCode/lineEvergreen.png"
                  alt="LINE QR"
                  style={{
                    width: "48px",
                    height: "48px",
                    objectFit: "contain",
                  }}
                />
                <div
                  style={{
                    fontSize: "5.5pt",
                    marginTop: "1mm",
                    fontWeight: "bold",
                  }}
                >
                  LINE
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
