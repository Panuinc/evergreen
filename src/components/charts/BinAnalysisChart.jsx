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

export default function BinAnalysisChart({ data = [] }) {
  if (!data.length) return <p className="text-sm text-default-400 text-center py-8">No data</p>;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="bin" fontSize={11} angle={-30} textAnchor="end" height={60} />
        <YAxis fontSize={12} allowDecimals={false} />
        <Tooltip
          formatter={(v, name) => [
            Number(v).toLocaleString("th-TH"),
            name === "count" ? "จำนวนรายการ" : "ต้นทุน",
          ]}
        />
        <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
