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

function fmt(v) {
  return `฿${Number(v).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

export default function CostVarianceChart({ data = [] }) {
  if (!data.length) return <p className="text-sm text-default-400 text-center py-8">No data</p>;

  // Filter out items with no variance
  const filtered = data.filter((d) => d.expected > 0 || d.variance !== 0);
  if (!filtered.length) return <p className="text-sm text-default-400 text-center py-8">ไม่พบข้อมูล Variance</p>;

  const chartData = filtered.map((d) => ({
    name: d.description.length > 25 ? d.description.slice(0, 25) + "..." : d.description,
    expected: d.expected,
    actual: d.actual,
    variance: d.variance,
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="name" fontSize={11} width={180} />
        <Tooltip
          formatter={(v, name) => [
            fmt(v),
            name === "expected" ? "ต้นทุนคาด" : name === "actual" ? "ต้นทุนจริง" : "ส่วนต่าง",
          ]}
        />
        <Legend />
        <Bar dataKey="expected" name="ต้นทุนคาด" fill="#94a3b8" radius={[0, 4, 4, 0]} />
        <Bar dataKey="actual" name="ต้นทุนจริง" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
