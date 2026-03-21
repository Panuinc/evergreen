"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { NewEmployeeTrendChartProps, HrTrendEntry } from "../types";

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("th-TH", { month: "short" });
}

interface ChartEntry {
  month: string;
  count: number;
}

export default function NewEmployeeTrendChart({ data = [] }: NewEmployeeTrendChartProps) {
  if (!data.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">No data</p>
    );
  }

  const chartData: ChartEntry[] = data.map((d: HrTrendEntry) => ({
    month: formatMonth(d.month),
    count: d.count,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip formatter={(value) => [value, "คน"]} />
        <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
