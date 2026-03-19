"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

const currentYear = new Date().getFullYear();
const prevYear = currentYear - 1;

export default function YoYComparisonChart({ data = [] }) {
  const [metric, setMetric] = useState("revenue");

  if (!data.length) {
    return <p className="text-xs text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  const chartData = data.map((d) => ({
    month: d.monthLabel,
    [`ปี ${currentYear}`]: metric === "revenue" ? d.currentRevenue : d.currentOrders,
    [`ปี ${prevYear}`]: metric === "revenue" ? d.previousRevenue : d.previousOrders,
  }));

  const isRevenue = metric === "revenue";

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setMetric("revenue")}
          className={`px-3 py-1 text-xs rounded-md border transition-colors ${metric === "revenue" ? "bg-primary text-white border-primary" : "border-border text-foreground hover:bg-default-100"}`}
        >
          ยอดขาย
        </button>
        <button
          onClick={() => setMetric("orders")}
          className={`px-3 py-1 text-xs rounded-md border transition-colors ${metric === "orders" ? "bg-primary text-white border-primary" : "border-border text-foreground hover:bg-default-100"}`}
        >
          ออเดอร์
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis
            fontSize={12}
            tickFormatter={isRevenue ? (v) => `฿${(v / 1000).toFixed(0)}k` : undefined}
          />
          <Tooltip
            formatter={(value, name) => [
              isRevenue ? formatCurrency(value) : value.toLocaleString(),
              name,
            ]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={`ปี ${currentYear}`}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey={`ปี ${prevYear}`}
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
