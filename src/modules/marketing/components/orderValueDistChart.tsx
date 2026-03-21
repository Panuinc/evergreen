"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import type { OrderValueDistChartProps } from "@/modules/marketing/types";

const colors = ["#10b981", "#3b82f6", "#6366f1", "#f59e0b", "#ef4444"];

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function OrderValueDistChart({ data = [] }: OrderValueDistChartProps) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="label" fontSize={12} />
        <YAxis fontSize={11} />
        <Tooltip
          formatter={(value, name) => [
            name === "count" ? `${value} ออเดอร์` : formatCurrency(value),
            name === "count" ? "จำนวน" : "ยอดขาย",
          ]}
          labelFormatter={(label) => `ช่วง ${label}`}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
