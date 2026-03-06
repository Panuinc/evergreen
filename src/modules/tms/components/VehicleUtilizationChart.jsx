"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function VehicleUtilizationChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" fontSize={12} allowDecimals={false} />
        <YAxis type="category" dataKey="vehicleName" fontSize={12} width={120} />
        <Tooltip formatter={(value) => [value, "Shipments (30 days)"]} />
        <Bar dataKey="shipmentCount" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
