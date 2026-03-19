"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

function formatMonth(monthStr) {
  const d = new Date(monthStr + "-01");
  return d.toLocaleDateString("th-TH", { month: "short", year: "2-digit" });
}

export default function OnTimeTrendChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  const chartData = data.map((d) => ({
    ...d,
    monthLabel: formatMonth(d.month),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="monthLabel" fontSize={11} />
        <YAxis fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <ReferenceLine y={90} stroke="#22c55e" strokeDasharray="3 3" label={{ value: "90%", position: "right", fontSize: 10 }} />
        <Tooltip
          formatter={(value, name) => {
            if (name === "rate") return [`${value}%`, "On-Time Rate"];
            return [value, name];
          }}
          labelFormatter={(label) => label}
        />
        <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
