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

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH")}`;
}

export default function FgOutputBreakdownChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label:
      d.category?.length > 20
        ? d.category.slice(0, 20) + "..."
        : d.category || "ไม่ระบุ",
  }));

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(250, chartData.length * 45)}
    >
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          type="number"
          fontSize={12}
          tickFormatter={(v) => v.toLocaleString("th-TH")}
        />
        <YAxis type="category" dataKey="label" fontSize={12} width={120} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload;
            if (!d) return null;
            return (
              <div className="bg-content1 border border-border rounded-lg p-3 shadow-lg text-sm">
                <p className="font-semibold mb-1">{d.category}</p>
                <p>
                  จำนวน:{" "}
                  {Number(d.quantity).toLocaleString("th-TH")} ชิ้น
                </p>
                <p>รายได้: {formatCurrency(d.revenue)}</p>
                <p>รายการ: {Number(d.count).toLocaleString("th-TH")} entries</p>
              </div>
            );
          }}
        />
        <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
