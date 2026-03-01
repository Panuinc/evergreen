"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#22c55e", "#ef4444", "#06b6d4", "#ec4899", "#a1a1aa"];

export default function EmployeeByDivisionChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-default-400 text-center py-8">No data</p>
    );
  }

  const chartData = data.map((d, i) => ({
    name: d.name,
    value: d.count,
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
        <Tooltip formatter={(value) => [value, "คน"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
