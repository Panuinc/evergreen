"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const BUCKET_COLORS = {
  Expired: "#ef4444",
  "< 30 Days": "#f59e0b",
  "< 90 Days": "#3b82f6",
  OK: "#22c55e",
};

export default function LicenseExpiryChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data</p>;
  }

  const chartData = data
    .filter((d) => d.count > 0)
    .map((d) => ({
      name: d.bucket,
      value: d.count,
      color: BUCKET_COLORS[d.bucket] || "#a1a1aa",
    }));

  if (!chartData.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data</p>;
  }

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
        <Tooltip formatter={(value) => [value, "Licenses"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
