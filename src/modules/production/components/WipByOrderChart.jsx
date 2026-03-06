"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function WipByOrderChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        ไม่มีข้อมูล WIP
      </p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: d.orderNo,
    shortDesc:
      d.description?.length > 25
        ? d.description.slice(0, 25) + "..."
        : d.description || d.orderNo,
  }));

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(280, chartData.length * 30)}
    >
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          type="number"
          fontSize={12}
          tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
        />
        <YAxis type="category" dataKey="label" fontSize={10} width={120} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload;
            if (!d) return null;
            return (
              <div className="bg-content1 border border-border rounded-lg p-3 shadow-lg text-sm">
                <p className="font-semibold mb-1">{d.orderNo}</p>
                <p className="text-muted-foreground mb-1">{d.description}</p>
                <p>ต้นทุนวัตถุดิบ: {formatCurrency(d.consumptionCost)}</p>
                <p>รายได้จากการขาย: {formatCurrency(d.revenue)}</p>
                <hr className="my-1 border-border" />
                <p className="font-semibold text-red-500">
                  WIP: {formatCurrency(d.wipValue)}
                </p>
              </div>
            );
          }}
        />
        <Bar dataKey="wipValue" radius={[0, 4, 4, 0]}>
          {chartData.map((d, i) => (
            <Cell
              key={i}
              fill={d.wipValue > 0 ? "#ef4444" : "#22c55e"}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
