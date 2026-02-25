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

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function CostByDepartmentChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label:
      d.department?.length > 20
        ? d.department.slice(0, 20) + "..."
        : d.department,
  }));

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(200, chartData.length * 40)}
    >
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          type="number"
          fontSize={12}
          tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
        />
        <YAxis type="category" dataKey="label" fontSize={12} width={100} />
        <Tooltip
          formatter={(value) => [formatCurrency(value), "ต้นทุนวัตถุดิบ"]}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
