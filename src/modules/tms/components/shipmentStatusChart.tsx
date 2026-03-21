"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ShipmentStatusChartProps } from "@/modules/tms/types";

const statusColors: Record<string, string> = {
  draft: "#a1a1aa",
  confirmed: "#3b82f6",
  dispatched: "#f59e0b",
  in_transit: "#8b5cf6",
  arrived: "#22c55e",
  delivered: "#10b981",
  pod_confirmed: "#059669",
  cancelled: "#ef4444",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  arrived: "Arrived",
  delivered: "Delivered",
  pod_confirmed: "POD Confirmed",
  cancelled: "Cancelled",
};

export default function ShipmentStatusChart({ data = [] }: ShipmentStatusChartProps) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">No data</p>;
  }

  const chartData = data.map((d) => ({
    name: statusLabels[d.tmsShipmentStatus] || d.tmsShipmentStatus,
    value: d.tmsShipmentCount,
    color: statusColors[d.tmsShipmentStatus] || "#a1a1aa",
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, "Shipments"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
