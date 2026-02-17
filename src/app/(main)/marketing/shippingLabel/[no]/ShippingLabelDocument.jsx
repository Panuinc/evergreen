"use client";

import { useEffect, useRef } from "react";

const SENDER = {
  name: "บริษัท ชื้อฮะฮวด อุตสาหกรรม จำกัด",
  nameEn: "Chua Ha Huad Industry Co., Ltd.",
  address: "EVERGREEN by CHH",
};

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

  // Generate all labels sequentially across items
  const labels = [];
  let runningNo = 0;
  for (const item of data.items) {
    for (let i = 0; i < item.qty; i++) {
      runningNo++;
      labels.push({
        runningNo,
        total: data.totalLabels,
        item,
      });
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
          /* Hide layout chrome (header, sidebar, breadcrumbs, chatbot) */
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
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      {/* Print Button */}
      <div className="no-print flex items-center justify-between mb-4">
        <p className="text-sm text-default-500">ใบปะหน้าส่งสินค้า — {data.orderNo} ({labels.length} ใบ)</p>
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

      {labels.map((label, idx) => (
        <div
          key={idx}
          className="label-page"
          style={{
            width: "100mm",
            height: "150mm",
            padding: "5mm",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            fontFamily: "sans-serif",
            color: "#000",
            backgroundColor: "#fff",
            pageBreakAfter: idx < labels.length - 1 ? "always" : "auto",
          }}
        >
          {/* Sender Section */}
          <div
            style={{
              borderBottom: "1.5px solid #000",
              paddingBottom: "2mm",
              marginBottom: "2mm",
            }}
          >
            <div style={{ fontSize: "8pt", fontWeight: "bold" }}>
              {SENDER.name}
            </div>
            <div style={{ fontSize: "6pt", color: "#666" }}>
              {SENDER.nameEn}
            </div>
            <div style={{ fontSize: "7pt", marginTop: "0.5mm", color: "#333" }}>
              ผู้ส่ง: {SENDER.address}
            </div>
          </div>

          {/* Recipient Section */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "1mm",
            }}
          >
            <div style={{ fontSize: "7pt", color: "#666", fontWeight: "bold" }}>
              ผู้รับ
            </div>
            <div style={{ fontSize: "11pt", fontWeight: "bold" }}>
              {data.recipient.name}
            </div>
            <div style={{ fontSize: "8pt", lineHeight: "1.3", whiteSpace: "pre-wrap" }}>
              {data.recipient.address}
            </div>
            {data.recipient.phone && (
              <div style={{ fontSize: "9pt", fontWeight: "bold" }}>
                โทร: {data.recipient.phone}
              </div>
            )}
          </div>

          {/* Order & Items List */}
          <div
            style={{
              borderTop: "1px dashed #999",
              paddingTop: "1.5mm",
              marginTop: "1mm",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "7pt",
                color: "#333",
                marginBottom: "1mm",
              }}
            >
              <span>Order: {data.orderNo}</span>
              {data.externalDocNo && <span>Ref: {data.externalDocNo}</span>}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "6.5pt" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #999" }}>
                  <th style={{ textAlign: "left", padding: "0.5mm 0", fontWeight: "600" }}>รายการ</th>
                  <th style={{ textAlign: "right", padding: "0.5mm 0", fontWeight: "600", width: "12mm" }}>จำนวน</th>
                  <th style={{ textAlign: "left", padding: "0.5mm 0 0.5mm 1mm", fontWeight: "600", width: "12mm" }}>หน่วย</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, i) => {
                  const isCurrentItem = item.description === label.item.description && item.itemNo === label.item.itemNo;
                  return (
                    <tr key={i} style={{ borderBottom: "1px dotted #ddd" }}>
                      <td style={{
                        padding: "0.5mm 0",
                        fontWeight: isCurrentItem ? "bold" : "normal",
                        color: isCurrentItem ? "#000" : "#555",
                      }}>
                        {isCurrentItem ? "▸ " : ""}{item.description}
                      </td>
                      <td style={{
                        textAlign: "right",
                        padding: "0.5mm 0",
                        fontWeight: isCurrentItem ? "bold" : "normal",
                        color: isCurrentItem ? "#000" : "#555",
                      }}>
                        {item.qty}
                      </td>
                      <td style={{
                        padding: "0.5mm 0 0.5mm 1mm",
                        color: isCurrentItem ? "#000" : "#555",
                      }}>
                        {item.uom}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Running Number */}
          <div
            style={{
              borderTop: "1.5px solid #000",
              marginTop: "2mm",
              paddingTop: "2mm",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "16pt", fontWeight: "bold", letterSpacing: "2px" }}>
              {label.runningNo} / {label.total}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
