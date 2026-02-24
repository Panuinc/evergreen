"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

function fmt(v) {
  return `฿${Number(v).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

export default function UnitCostAnalysisChart({ data = [] }) {
  if (!data.length) return <p className="text-sm text-default-400 text-center py-8">No data</p>;

  const chartData = data.map((d) => ({
    name: d.description.length > 30 ? d.description.slice(0, 30) + "..." : d.description,
    unitCost: d.unitCost,
    totalCost: d.totalCost,
    totalQty: d.totalQty,
  }));

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <XAxis type="number" fontSize={12} tickFormatter={(v) => `฿${(v / 1).toLocaleString()}`} />
        <YAxis type="category" dataKey="name" fontSize={11} width={200} />
        <Tooltip
          formatter={(v, name) => [
            name === "unitCost" ? fmt(v) + "/หน่วย" : fmt(v),
            name === "unitCost" ? "ต้นทุน/หน่วย" : "ต้นทุนรวม",
          ]}
        />
        <Bar dataKey="unitCost" fill="#f97316" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
