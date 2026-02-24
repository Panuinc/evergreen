"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";

function fmt(v) {
  return `฿${Number(v).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

export default function YieldRateChart({ data = [] }) {
  if (!data.length) return <p className="text-sm text-default-400 text-center py-8">No data</p>;

  const chartData = data.map((d) => ({
    order: d.orderNo,
    consumptionCost: d.consumptionCost,
    outputCost: d.outputCost,
    yieldRate: d.yieldRate,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis dataKey="order" fontSize={10} angle={-30} textAnchor="end" height={60} />
        <YAxis fontSize={12} tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          formatter={(v, name) => [
            name === "yieldRate" ? `${v}%` : fmt(v),
            name === "consumptionCost" ? "ต้นทุนวัตถุดิบ" : name === "outputCost" ? "มูลค่าผลผลิต" : "Yield Rate",
          ]}
        />
        <Legend />
        <Bar dataKey="consumptionCost" name="ต้นทุนวัตถุดิบ" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="outputCost" name="มูลค่าผลผลิต" fill="#22c55e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
