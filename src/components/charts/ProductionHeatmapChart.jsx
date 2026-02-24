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

export default function ProductionHeatmapChart({ data = [] }) {
  if (!data.length) return <p className="text-sm text-default-400 text-center py-8">No data</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="day" fontSize={12} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip
          formatter={(v, name) => [
            Number(v).toLocaleString("th-TH"),
            name === "consumption" ? "เบิกวัตถุดิบ" : "ผลผลิต",
          ]}
        />
        <Legend />
        <Bar dataKey="consumption" name="เบิกวัตถุดิบ" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="output" name="ผลผลิต" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
