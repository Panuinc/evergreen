"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function DailyProductionTrendChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>;
  }

  const chartData = data.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="dateLabel" fontSize={11} />
        <YAxis fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value, name) => [
            formatCurrency(value),
            name === "consumption" ? "ต้นทุนวัตถุดิบ" : "มูลค่าผลผลิต",
          ]}
          labelFormatter={(label) => label}
        />
        <Legend formatter={(value) => (value === "consumption" ? "ต้นทุนวัตถุดิบ" : "มูลค่าผลผลิต")} />
        <Line type="monotone" dataKey="consumption" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="output" stroke="#22c55e" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
