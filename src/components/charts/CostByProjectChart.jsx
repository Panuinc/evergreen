"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function CostByProjectChart({ data = [] }) {
  if (!data.length) {
    return <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="project" fontSize={11} angle={-45} textAnchor="end" height={60} />
        <YAxis fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <Tooltip formatter={(value, name) => [formatCurrency(value), name === "consumptionCost" ? "ต้นทุนวัตถุดิบ" : "มูลค่าผลผลิต"]} />
        <Legend formatter={(value) => (value === "consumptionCost" ? "ต้นทุนวัตถุดิบ" : "มูลค่าผลผลิต")} />
        <Bar dataKey="consumptionCost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="outputValue" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
