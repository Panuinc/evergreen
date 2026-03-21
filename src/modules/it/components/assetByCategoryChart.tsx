"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const categoryColors = {
  computer: "#3b82f6",
  server: "#8b5cf6",
  printer: "#f59e0b",
  network: "#22c55e",
  other: "#a1a1aa",
};

const categoryLabels = {
  computer: "Computer",
  server: "Server",
  printer: "Printer",
  network: "Network",
  other: "Other",
};

export default function AssetByCategoryChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">No data</p>;
  }

  const chartData = data.map((d) => ({
    name: categoryLabels[d.category] || d.category,
    value: d.count,
    color: categoryColors[d.category] || "#a1a1aa",
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
        <Tooltip formatter={(value) => [value, "Assets"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
