"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function WipByOrderChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล WIP</p>;
  }

  const chartData = data.map((d) => ({
    ...d,
    label: d.orderNo,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="label" fontSize={10} angle={-45} textAnchor="end" height={70} />
        <YAxis fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(value, name) => {
            const labels = {
              consumptionCost: "ต้นทุนวัตถุดิบ",
              outputValue: "มูลค่าผลผลิต",
              wipValue: "WIP",
            };
            return [formatCurrency(value), labels[name] || name];
          }}
        />
        <Legend
          formatter={(value) => {
            const labels = {
              consumptionCost: "ต้นทุนวัตถุดิบ",
              outputValue: "มูลค่าผลผลิต",
              wipValue: "WIP",
            };
            return labels[value] || value;
          }}
        />
        <Bar dataKey="consumptionCost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="outputValue" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="wipValue" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
