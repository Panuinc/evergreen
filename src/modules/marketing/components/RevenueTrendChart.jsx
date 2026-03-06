"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function formatMonth(monthStr) {
  const [year, month] = monthStr.split("-");
  return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("th-TH", {
    month: "short",
    year: "2-digit",
  });
}

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function RevenueTrendChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="month" fontSize={12} />
        <YAxis fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value, name) => [
            name === "revenue" ? formatCurrency(value) : value,
            name === "revenue" ? "ยอดขาย" : "ออเดอร์",
          ]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#revenueGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
