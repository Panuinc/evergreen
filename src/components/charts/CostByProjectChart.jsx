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

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function CostByProjectChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label:
      d.project?.length > 20 ? d.project.slice(0, 20) + "..." : d.project,
  }));

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(280, chartData.length * 32)}
    >
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          type="number"
          fontSize={12}
          tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
        />
        <YAxis type="category" dataKey="label" fontSize={11} width={140} />
        <Tooltip
          formatter={(value, name) => {
            const labels = {
              consumptionCost: "ต้นทุนวัตถุดิบ",
              revenue: "รายได้จากการขาย",
            };
            return [formatCurrency(value), labels[name] || name];
          }}
          labelFormatter={(label) => label}
        />
        <Legend
          formatter={(value) =>
            value === "consumptionCost" ? "ต้นทุนวัตถุดิบ" : "รายได้จากการขาย"
          }
        />
        <Bar
          dataKey="consumptionCost"
          fill="#f59e0b"
          radius={[0, 4, 4, 0]}
        />
        <Bar dataKey="revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
