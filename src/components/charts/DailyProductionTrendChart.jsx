"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function DailyProductionTrendChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-default-400 text-center py-8">ไม่มีข้อมูล</p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="gradConsumption" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradOutput" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis dataKey="dateLabel" fontSize={11} interval="preserveStartEnd" />
        <YAxis
          fontSize={12}
          tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value, name) => [
            formatCurrency(value),
            name === "consumption" ? "ต้นทุนวัตถุดิบ" : "รายได้จากการขาย",
          ]}
          labelFormatter={(label) => label}
        />
        <Legend
          formatter={(value) =>
            value === "consumption" ? "ต้นทุนวัตถุดิบ" : "รายได้จากการขาย"
          }
        />
        <Area
          type="monotone"
          dataKey="consumption"
          stroke="#f59e0b"
          strokeWidth={2}
          fill="url(#gradConsumption)"
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#gradOutput)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
