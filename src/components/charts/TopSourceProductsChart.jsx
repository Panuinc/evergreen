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

function fmt(v) {
  return `฿${Number(v).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

export default function TopSourceProductsChart({ data = [] }) {
  if (!data.length) return <p className="text-sm text-default-400 text-center py-8">No data</p>;

  const chartData = data.map((d) => ({
    name: d.description.length > 30 ? d.description.slice(0, 30) + "..." : d.description,
    cost: d.cost,
    items: d.items,
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="name" fontSize={11} width={200} />
        <Tooltip formatter={(v) => [fmt(v), "ต้นทุนวัตถุดิบ"]} />
        <Bar dataKey="cost" fill="#ef4444" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
