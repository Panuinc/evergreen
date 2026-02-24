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

function formatMonth(m) {
  const [y, mo] = m.split("-");
  return new Date(parseInt(y), parseInt(mo) - 1).toLocaleDateString("th-TH", { month: "short", year: "2-digit" });
}

export default function ProductionMonthlyCompareChart({ data = [] }) {
  if (!data.length) return <p className="text-sm text-default-400 text-center py-8">No data</p>;

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    consumption: d.consumption,
    output: d.output,
    orders: d.orders,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="consumption" name="เบิกวัตถุดิบ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="output" name="ผลผลิต" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="orders" name="ใบสั่งผลิต" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
