"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const TYPE_COLORS = {
  "ที่อยู่อาศัย": "#3b82f6",
  "อาคารพาณิชย์": "#f59e0b",
  "อุตสาหกรรม": "#ef4444",
  "สาธารณูปโภค": "#10b981",
};

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function ProjectTypeChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis fontSize={11} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value, name) => [
            name === "revenue" ? formatCurrency(value) : `${value}`,
            name === "revenue" ? "ยอดขาย" : name === "orders" ? "ออเดอร์" : "ลูกค้า",
          ]}
        />
        <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={TYPE_COLORS[d.label] || "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
