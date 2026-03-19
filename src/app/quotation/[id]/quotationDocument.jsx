"use client";

function formatThaiDate(dateStr) {
  const d = new Date(dateStr);
  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

function formatPrice(price) {
  if (!price || price === 0) return "รอแจ้งราคา";
  return price.toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

const statusMap = {
  draft: "ร่าง",
  pending_approval: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
  paid: "ชำระแล้ว",
  cancelled: "ยกเลิก",
};

export default function QuotationDocument({ quotation, lines }) {
  return (
    <div className="min-h-screen bg-white print:bg-white">
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 1cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      {}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-lg hover:bg-blue-700 text-xs font-light"
        >
          พิมพ์ / Save PDF
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto p-8 text-black text-xs">
        {}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-6">
          <div>
            <p className="text-xs font-light">บริษัท ชื้อฮะฮวด อุตสาหกรรม จำกัด</p>
            <p className="text-xs text-gray-600 mt-1">Chua Ha Huad Industry Co., Ltd.</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-light text-blue-700">ใบเสนอราคา</p>
            <p className="text-xs text-gray-500">QUOTATION</p>
          </div>
        </div>

        {}
        <div className="flex justify-between mb-6">
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <span className="font-light w-24">ลูกค้า:</span>
              <span>{quotation.omQuotationCustomerName || "-"}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-light w-24">เบอร์โทร:</span>
              <span>{quotation.omQuotationCustomerPhone || "-"}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-light w-24">ที่อยู่จัดส่ง:</span>
              <span className="max-w-xs">{quotation.omQuotationCustomerAddress || "-"}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-light w-24">ชำระเงิน:</span>
              <span>{quotation.omQuotationPaymentMethod || "-"}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <div className="flex gap-2 justify-end">
              <span className="font-light">เลขที่:</span>
              <span>{quotation.omQuotationNumber}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <span className="font-light">วันที่:</span>
              <span>{formatThaiDate(quotation.omQuotationCreatedAt)}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <span className="font-light">สถานะ:</span>
              <span>{statusMap[quotation.omQuotationStatus] || quotation.omQuotationStatus}</span>
            </div>
          </div>
        </div>

        {}
        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="bg-blue-700 text-white">
              <th className="border border-blue-700 px-3 py-2 text-center w-12">ลำดับ</th>
              <th className="border border-blue-700 px-3 py-2 text-left">รายการสินค้า</th>
              <th className="border border-blue-700 px-3 py-2 text-center w-20">จำนวน</th>
              <th className="border border-blue-700 px-3 py-2 text-right w-28">ราคา/หน่วย</th>
              <th className="border border-blue-700 px-3 py-2 text-right w-28">รวม</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={line.omQuotationLineId} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border border-gray-300 px-3 py-2 text-center">{line.omQuotationLineOrder}</td>
                <td className="border border-gray-300 px-3 py-2">
                  {line.omQuotationLineProductName}
                  {line.omQuotationLineVariant && (
                    <span className="text-gray-500 text-xs ml-2">({line.omQuotationLineVariant})</span>
                  )}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-center">{line.omQuotationLineQuantity}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {formatPrice(line.omQuotationLineUnitPrice)}
                </td>
                <td className="border border-gray-300 px-3 py-2 text-right">
                  {formatPrice(line.omQuotationLineAmount)}
                </td>
              </tr>
            ))}
            {lines.length === 0 && (
              <tr>
                <td colSpan={5} className="border border-gray-300 px-3 py-4 text-center text-gray-400">
                  ไม่มีรายการสินค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {}
        {quotation.omQuotationNotes && (
          <div className="mb-6 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="font-light text-xs mb-1">หมายเหตุ:</p>
            <p className="whitespace-pre-wrap">{quotation.omQuotationNotes}</p>
          </div>
        )}

        {}
        <div className="border-t border-gray-300 pt-4 mt-8 text-xs text-gray-500 text-center">
          <p>เอกสารนี้สร้างโดยระบบอัตโนมัติ กรุณาติดต่อเจ้าหน้าที่เพื่อยืนยันราคาและรายละเอียด</p>
        </div>
      </div>
    </div>
  );
}
