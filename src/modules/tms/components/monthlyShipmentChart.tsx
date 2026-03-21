"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { MonthlyShipmentChartProps } from "@/modules/tms/types";

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("th-TH", { month: "short" });
}

export default function MonthlyShipmentChart({ data = [] }: MonthlyShipmentChartProps) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">No data</p>;
  }

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    tmsShipmentCount: d.tmsShipmentCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip formatter={(value) => [value, "Shipments"]} />
        <Bar dataKey="tmsShipmentCount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
