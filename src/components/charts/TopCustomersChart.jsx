"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function TopCustomersChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>;
  }

  const chartData = data.map((d) => ({
    name: d.name.length > 25 ? d.name.slice(0, 25) + "..." : d.name,
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis type="number" fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="name" fontSize={11} width={160} />
        <Tooltip
          formatter={(value, name) => [
            name === "revenue" ? formatCurrency(value) : `${value} ออเดอร์`,
            name === "revenue" ? "ยอดขาย" : "จำนวน",
          ]}
        />
        <Bar dataKey="revenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
