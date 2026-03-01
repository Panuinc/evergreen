"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function formatMonth(monthStr) {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("th-TH", { month: "short" });
}

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function MaintenanceCostChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-default-400 text-center py-8">No data</p>;
  }

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    totalCost: d.totalCost,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value) => [formatCurrency(value), "Maintenance Cost"]} />
        <Bar dataKey="totalCost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
