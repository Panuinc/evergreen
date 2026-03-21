"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { FuelCostChartProps } from "@/modules/tms/types";

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("th-TH", { month: "short" });
}

function formatCurrency(value: number | string): string {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function FuelCostChart({ data = [] }: FuelCostChartProps) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">No data</p>;
  }

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    tmsFuelLogTotalCost: d.tmsFuelLogTotalCost,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value) => [formatCurrency(value as number), "Fuel Cost"]} />
        <Line type="monotone" dataKey="tmsFuelLogTotalCost" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
