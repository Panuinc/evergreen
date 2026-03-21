"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { VehicleUtilizationChartProps } from "@/modules/tms/types";

export default function VehicleUtilizationChart({ data = [] }: VehicleUtilizationChartProps) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">No data</p>;
  }

  // Map to chart-friendly keys (tmsVehicleName อาจเป็น null ให้ fallback ไป tmsVehiclePlateNumber)
  const chartData = data.map((d) => ({
    vehicleLabel: d.tmsVehicleName || d.tmsVehiclePlateNumber,
    tmsShipmentCount: d.tmsShipmentCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" fontSize={12} allowDecimals={false} />
        <YAxis type="category" dataKey="vehicleLabel" fontSize={12} width={120} />
        <Tooltip formatter={(value) => [value, "Shipments (30 days)"]} />
        <Bar dataKey="tmsShipmentCount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
