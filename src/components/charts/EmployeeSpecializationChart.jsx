"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export default function EmployeeSpecializationChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>
    );
  }

  // Collect all unique categories across employees
  const allCategories = new Set();
  for (const emp of data) {
    for (const c of emp.categories) {
      allCategories.add(c.category);
    }
  }
  const categories = [...allCategories];

  // Transform to flat rows for stacked bar
  const chartData = data.map((emp) => {
    const row = {
      employee:
        emp.employee.length > 18
          ? emp.employee.slice(0, 18) + "..."
          : emp.employee,
    };
    for (const c of emp.categories) {
      row[c.category] = c.quantity;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 35)}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          type="number"
          fontSize={12}
          tickFormatter={(v) => v.toLocaleString("th-TH")}
        />
        <YAxis type="category" dataKey="employee" fontSize={11} width={140} />
        <Tooltip
          formatter={(value, name) => [
            `${Number(value).toLocaleString("th-TH")} ชิ้น`,
            name,
          ]}
        />
        <Legend fontSize={11} />
        {categories.map((cat, i) => (
          <Bar
            key={cat}
            dataKey={cat}
            stackId="a"
            fill={COLORS[i % COLORS.length]}
            radius={
              i === categories.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]
            }
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
