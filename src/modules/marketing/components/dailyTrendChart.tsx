"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { DailyTrendChartProps } from "@/modules/marketing/types";

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function DailyTrendChart({ data = [] }: DailyTrendChartProps) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">ไม่มีข้อมูลเดือนนี้</p>;
  }

  const chartData = data.map((d) => ({
    date: d.date.slice(8, 10),
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="date" fontSize={11} />
        <YAxis fontSize={11} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value, name) => [
            name === "revenue" ? formatCurrency(value) : `${value} รายการ`,
            name === "revenue" ? "ยอดขาย" : "ออเดอร์",
          ]}
          labelFormatter={(label) => `วันที่ ${label}`}
        />
        <Bar dataKey="revenue" fill="#10b981" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
