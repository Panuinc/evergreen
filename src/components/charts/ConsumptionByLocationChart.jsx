"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316", "#a855f7",
];

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

export default function ConsumptionByLocationChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-default-400 text-center py-8">No data</p>;
  }

  const chartData = data.map((d, i) => ({
    name: d.location,
    value: d.cost,
    color: COLORS[i % COLORS.length],
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
        <Tooltip formatter={(value) => [formatCurrency(value), "ต้นทุน"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
