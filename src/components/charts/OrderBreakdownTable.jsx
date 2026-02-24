"use client";

function fmt(v) {
  return `฿${Number(v).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export default function OrderBreakdownTable({ data = [] }) {
  if (!data.length) return <p className="text-sm text-default-400 text-center py-8">No data</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-default-200 text-default-500">
            <th className="text-left py-2 px-2 font-medium">ใบสั่งผลิต</th>
            <th className="text-right py-2 px-2 font-medium">ต้นทุนวัตถุดิบ</th>
            <th className="text-right py-2 px-2 font-medium">มูลค่าผลผลิต</th>
            <th className="text-center py-2 px-2 font-medium">เบิก</th>
            <th className="text-center py-2 px-2 font-medium">ผลิต</th>
            <th className="text-center py-2 px-2 font-medium">วัตถุดิบ</th>
            <th className="text-center py-2 px-2 font-medium">FG</th>
            <th className="text-center py-2 px-2 font-medium">วันที่</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.orderNo} className="border-b border-default-100 hover:bg-default-50">
              <td className="py-2 px-2 font-mono text-xs">{row.orderNo}</td>
              <td className="py-2 px-2 text-right text-danger">{fmt(row.consumptionCost)}</td>
              <td className="py-2 px-2 text-right text-success">{fmt(row.outputCost)}</td>
              <td className="py-2 px-2 text-center">{row.consumptionCount}</td>
              <td className="py-2 px-2 text-center">{row.outputCount}</td>
              <td className="py-2 px-2 text-center">{row.materials}</td>
              <td className="py-2 px-2 text-center">{row.outputs}</td>
              <td className="py-2 px-2 text-center text-xs text-default-400">
                {fmtDate(row.firstDate)}{row.firstDate !== row.lastDate ? ` - ${fmtDate(row.lastDate)}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
