"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function OrdersByStatusChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value} ใบ`, "จำนวน"]} />
        <Legend fontSize={12} />
      </PieChart>
    </ResponsiveContainer>
  );
}
