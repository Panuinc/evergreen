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

export default function TopOutputItemsChart({ data = [] }) {
  if (!data.length) return <p className="text-sm text-default-400 text-center py-8">No data</p>;

  const chartData = data.map((d) => ({
    name: d.description.length > 25 ? d.description.slice(0, 25) + "..." : d.description,
    qty: d.qty,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" fontSize={12} allowDecimals={false} />
        <YAxis type="category" dataKey="name" fontSize={11} width={160} />
        <Tooltip formatter={(v) => [Number(v).toLocaleString("th-TH"), "จำนวนผลิต"]} />
        <Bar dataKey="qty" fill="#22c55e" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
