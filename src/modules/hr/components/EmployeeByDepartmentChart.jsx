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

export default function EmployeeByDepartmentChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">No data</p>
    );
  }

  const chartData = data
    .sort((a, b) => b.count - a.count)
    .map((d) => ({ name: d.name, count: d.count }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" fontSize={12} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          fontSize={12}
          width={120}
          tick={{ fontSize: 11 }}
        />
        <Tooltip formatter={(value) => [value, "คน"]} />
        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
