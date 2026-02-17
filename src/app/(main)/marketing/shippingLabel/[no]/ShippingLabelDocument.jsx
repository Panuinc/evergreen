"use client";

import { useState, useEffect } from "react";

const SENDER = {
  name: "บริษัท ชื้อฮะฮวด อุตสาหกรรม จำกัด",
  nameEn: "Chua Ha Huad Industry Co., Ltd.",
  address: "EVERGREEN by CHH",
};

export default function ShippingLabelDocument({ orderNo }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    const key = `shipping-label-${orderNo}`;
    const raw = sessionStorage.getItem(key);
    if (raw) {
      setData(JSON.parse(raw));
      setTimeout(() => window.print(), 500);
    }
  }, [orderNo]);

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
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-700 text-sm font-medium"
        >
          พิมพ์ ({labels.length} ใบ)
        </button>
        <button
          onClick={() => window.close()}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg shadow hover:bg-gray-300 text-sm font-medium"
        >
          ปิด
        </button>
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
              borderBottom: "2px solid #000",
              paddingBottom: "3mm",
              marginBottom: "3mm",
            }}
          >
            <div style={{ fontSize: "11pt", fontWeight: "bold" }}>
              {SENDER.name}
            </div>
            <div style={{ fontSize: "8pt", color: "#666" }}>
              {SENDER.nameEn}
            </div>
            <div style={{ fontSize: "9pt", marginTop: "1mm", color: "#333" }}>
              ผู้ส่ง: {SENDER.address}
            </div>
          </div>

          {/* Recipient Section */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "2mm",
            }}
          >
            <div style={{ fontSize: "9pt", color: "#666", fontWeight: "bold" }}>
              ผู้รับ
            </div>
            <div style={{ fontSize: "14pt", fontWeight: "bold" }}>
              {data.recipient.name}
            </div>
            <div style={{ fontSize: "10pt", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
              {data.recipient.address}
            </div>
            {data.recipient.phone && (
              <div style={{ fontSize: "11pt", fontWeight: "bold" }}>
                โทร: {data.recipient.phone}
              </div>
            )}
          </div>

          {/* Order & Item Info */}
          <div
            style={{
              borderTop: "1px dashed #999",
              paddingTop: "3mm",
              marginTop: "2mm",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "9pt",
                color: "#333",
              }}
            >
              <span>Order: {data.orderNo}</span>
              {data.externalDocNo && <span>Ref: {data.externalDocNo}</span>}
            </div>
            <div
              style={{
                fontSize: "10pt",
                marginTop: "1mm",
                fontWeight: "500",
              }}
            >
              {label.item.description}
            </div>
            <div style={{ fontSize: "9pt", color: "#555", marginTop: "1mm" }}>
              จำนวน: {label.item.qty} {label.item.uom}
            </div>
          </div>

          {/* Running Number */}
          <div
            style={{
              borderTop: "2px solid #000",
              marginTop: "3mm",
              paddingTop: "3mm",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "20pt", fontWeight: "bold", letterSpacing: "2px" }}>
              {label.runningNo} / {label.total}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
