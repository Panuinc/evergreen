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
  return `฿${Number(value).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

export default function ProductionCostByOrderChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-default-400 text-center py-8">No data</p>;
  }

  const chartData = data.map((d) => ({
    order: d.orderNo,
    cost: d.cost,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="order" fontSize={10} angle={-30} textAnchor="end" height={60} />
        <YAxis fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value) => [formatCurrency(value), "ต้นทุนวัตถุดิบ"]} />
        <Bar dataKey="cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
