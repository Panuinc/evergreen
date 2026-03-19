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

export default function TopConsumedItemsChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label:
      d.description?.length > 25
        ? d.description.slice(0, 25) + "..."
        : d.description || d.itemNo,
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
        <YAxis type="category" dataKey="label" fontSize={11} width={160} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload;
            if (!d) return null;
            return (
              <div className="bg-content1 border border-border rounded-lg p-3 shadow-lg text-xs">
                <p className="font-light mb-1">
                  {d.description || d.itemNo}
                </p>
                <p>รหัสสินค้า: {d.itemNo}</p>
                <p>ต้นทุนรวม: {formatCurrency(d.cost)}</p>
                <p>
                  จำนวนเบิก:{" "}
                  {Number(d.quantity).toLocaleString("th-TH")} ชิ้น
                </p>
                {d.quantity > 0 && (
                  <p>
                    ต้นทุนเฉลี่ย:{" "}
                    {formatCurrency(Math.round(d.cost / d.quantity))}/ชิ้น
                  </p>
                )}
              </div>
            );
          }}
        />
        <Bar dataKey="cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
