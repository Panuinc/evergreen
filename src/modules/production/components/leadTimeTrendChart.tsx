"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import type { LeadTimeTrendChartProps } from "@/modules/production/types";

function formatMonth(monthStr: string): string {
  const d = new Date(monthStr + "-01");
  return d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" });
}

export default function LeadTimeTrendChart({ data = [] }: LeadTimeTrendChartProps) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  const chartData = data.map((d) => ({
    ...d,
    monthLabel: formatMonth(d.month),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="monthLabel" fontSize={11} />
        <YAxis yAxisId="left" fontSize={12} tickFormatter={(v) => `${v} วัน`} />
        <YAxis yAxisId="right" orientation="right" fontSize={12} tickFormatter={(v) => `${v} ใบ`} />
        <Tooltip
          formatter={(value, name) => {
            if (name === "avgDays") return [`${value} วัน`, "Avg Lead Time"];
            if (name === "count") return [`${value} ใบ`, "จำนวนใบสั่งผลิต"];
            return [value, name];
          }}
          labelFormatter={(label) => label}
        />
        <Legend
          formatter={(value) =>
            value === "avgDays" ? "Avg Lead Time" : "จำนวนใบสั่งผลิต"
          }
        />
        <Bar yAxisId="right" dataKey="count" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
        <Line yAxisId="left" type="monotone" dataKey="avgDays" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
