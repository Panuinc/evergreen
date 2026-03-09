"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function OutputByEmployeeChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  const chartData = data.map((d) => ({
    ...d,
    label: d.employee?.length > 20 ? d.employee.slice(0, 20) + "..." : d.employee,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis type="number" fontSize={12} tickFormatter={(v) => v.toLocaleString("th-TH")} />
        <YAxis type="category" dataKey="label" fontSize={11} width={140} />
        <Tooltip
          formatter={(value) => [`${Number(value).toLocaleString("th-TH")} ชิ้น`, "ผลผลิต"]}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="quantity" fill="#06b6d4" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
