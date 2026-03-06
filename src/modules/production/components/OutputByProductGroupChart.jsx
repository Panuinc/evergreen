"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function OutputByProductGroupChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis type="number" fontSize={12} tickFormatter={(v) => v.toLocaleString("th-TH")} />
        <YAxis type="category" dataKey="group" fontSize={12} width={80} />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString("th-TH")} ชิ้น`, "ผลผลิต"]}
        />
        <Bar dataKey="quantity" fill="#22c55e" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
