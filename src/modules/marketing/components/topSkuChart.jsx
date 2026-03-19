"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function TopSkuChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  const hasRevenue = data.some((d) => d.revenue > 0);
  const dataKey = hasRevenue ? "revenue" : "quantity";

  const chartData = data.map((d) => ({
    name: (d.description || d.sku || "").length > 25 ? (d.description || d.sku).slice(0, 25) + "..." : (d.description || d.sku),
    revenue: d.revenue,
    quantity: d.quantity,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis
          type="number"
          fontSize={12}
          tickFormatter={hasRevenue ? (v) => `฿${(v / 1000).toFixed(0)}k` : undefined}
        />
        <YAxis type="category" dataKey="name" fontSize={11} width={160} />
        <Tooltip
          formatter={(value, name) => [
            name === "revenue" ? formatCurrency(value) : `${value} ชิ้น`,
            name === "revenue" ? "ยอดขาย" : "จำนวน",
          ]}
        />
        <Bar dataKey={dataKey} fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
