"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

const CHANNEL_COLORS = {
  LINE: "#06c755",
  Facebook: "#1877f2",
  Instagram: "#e4405f",
  Shopee: "#ee4d2d",
  TikTok: "#000000",
  Lazada: "#0f146d",
  Website: "#3b82f6",
};

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function ChannelDistChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis type="number" fontSize={11} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="label" fontSize={12} width={90} />
        <Tooltip
          formatter={(value, name) => [
            name === "revenue" ? formatCurrency(value) : `${value}`,
            name === "revenue" ? "ยอดขาย" : name === "orders" ? "ออเดอร์" : "ลูกค้า",
          ]}
        />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={CHANNEL_COLORS[d.label] || "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
