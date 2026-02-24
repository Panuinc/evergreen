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

export default function CostByOperatorChart({ data = [] }) {
  if (!data.length) return <p className="text-sm text-default-400 text-center py-8">No data</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(v, name) => [
          name === "cost" ? `฿${Number(v).toLocaleString("th-TH")}` : Number(v).toLocaleString("th-TH"),
          name === "cost" ? "ต้นทุน" : name === "consumption" ? "เบิก" : "ผลผลิต",
        ]} />
        <Legend />
        <Bar dataKey="cost" name="ต้นทุน" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
