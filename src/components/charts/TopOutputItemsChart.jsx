"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TopOutputItemsChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>;
  }

  const chartData = data.map((d) => ({
    ...d,
    label: d.description?.length > 25 ? d.description.slice(0, 25) + "..." : d.description || d.itemNo,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis type="number" fontSize={12} tickFormatter={(v) => v.toLocaleString("th-TH")} />
        <YAxis type="category" dataKey="label" fontSize={11} width={160} />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString("th-TH")} ชิ้น`, "ผลผลิต"]}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
