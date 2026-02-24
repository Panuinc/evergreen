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

export default function ProductionDailyTrendChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-default-400 text-center py-8">No data</p>;
  }

  const chartData = data.map((d) => ({
    date: new Date(d.date).toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
    consumption: d.consumption,
    output: d.output,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="date" fontSize={11} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip />
        <Legend />
        <Bar dataKey="consumption" name="เบิกวัตถุดิบ" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
        <Bar dataKey="output" name="ผลผลิต" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}
