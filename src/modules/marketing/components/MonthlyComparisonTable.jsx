"use client";

import { Chip } from "@heroui/react";

function formatCurrency(value) {
  return `฿${Number(value || 0).toLocaleString("th-TH")}`;
}

function formatMonth(monthStr) {
  if (!monthStr) return "-";
  const [year, month] = monthStr.split("-");
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("th-TH", {
    month: "short",
    year: "2-digit",
  });
}

function ChangeCell({ current, previous, suffix = "", isPercent = false }) {
  if (!previous) return <span className="text-sm text-muted-foreground">—</span>;
  const diff = isPercent ? current - previous : ((current - previous) / previous) * 100;
  const isPositive = diff >= 0;
  return (
    <Chip size="md" variant="flat" color={isPositive ? "success" : "danger"}>
      {isPositive ? "+" : ""}{diff.toFixed(1)}{isPercent ? "pp" : "%"}
    </Chip>
  );
}

export default function MonthlyComparisonTable({ data }) {
  if (!data?.current || !data?.previous) {
    return <p className="text-sm text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  const { current: c, previous: p } = data;

  const rows = [
    { label: "ยอดขาย", curr: formatCurrency(c.revenue), prev: formatCurrency(p.revenue), currentVal: c.revenue, prevVal: p.revenue },
    { label: "ออเดอร์", curr: c.orders, prev: p.orders, currentVal: c.orders, prevVal: p.orders },
    { label: "Avg. Order", curr: formatCurrency(Math.round(c.avgValue)), prev: formatCurrency(Math.round(p.avgValue)), currentVal: c.avgValue, prevVal: p.avgValue },
    { label: "อัตราจัดส่ง", curr: `${c.shipRate}%`, prev: `${p.shipRate}%`, currentVal: c.shipRate, prevVal: p.shipRate, isPercent: true },
    { label: "ลูกค้า", curr: c.uniqueCustomers, prev: p.uniqueCustomers, currentVal: c.uniqueCustomers, prevVal: p.uniqueCustomers },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 pr-3 text-muted-foreground font-light">Metric</th>
            <th className="text-right py-2 px-3 text-muted-foreground font-light">{formatMonth(p.month)}</th>
            <th className="text-right py-2 px-3 text-muted-foreground font-light">{formatMonth(c.month)}</th>
            <th className="text-right py-2 pl-3 text-muted-foreground font-light">Change</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border">
              <td className="py-2 pr-3 text-foreground">{row.label}</td>
              <td className="py-2 px-3 text-right text-muted-foreground">{row.prev}</td>
              <td className="py-2 px-3 text-right font-light">{row.curr}</td>
              <td className="py-2 pl-3 text-right">
                <ChangeCell current={row.currentVal} previous={row.prevVal} isPercent={row.isPercent} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
