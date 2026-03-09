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
  ReferenceLine,
} from "recharts";

function formatCurrency(v) {
  return `฿${Number(v).toLocaleString("th-TH")}`;
}

export default function ProfitByItemChart({ data = [] }) {
  if (!data.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>
    );
  }

  // Show items sorted by profitAmount (diverging bar: green=profit, red=loss)
  const chartData = data
    .filter((d) => d.totalRevenue > 0)
    .sort((a, b) => b.profitAmount - a.profitAmount)
    .slice(0, 15)
    .map((d) => ({
      ...d,
      label:
        (d.description || d.itemNo).length > 30
          ? (d.description || d.itemNo).slice(0, 30) + "..."
          : d.description || d.itemNo,
      marginLabel: d.profitMargin != null ? `${d.profitMargin}%` : "-",
    }));

  if (!chartData.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">
        ไม่มีข้อมูลราคาขาย
      </p>
    );
  }

  return (
    <ResponsiveContainer
      width="100%"
      height={Math.max(300, chartData.length * 36)}
    >
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
        <XAxis
          type="number"
          fontSize={12}
          tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`}
        />
        <YAxis type="category" dataKey="label" fontSize={11} width={200} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0]?.payload;
            if (!d) return null;
            return (
              <div className="bg-content1 border border-border rounded-lg p-3 shadow-lg text-xs">
                <p className="font-light mb-1">{d.description || d.itemNo}</p>
                <p>ราคาขาย: {formatCurrency(d.sellingPrice)}/ชิ้น</p>
                <p>ต้นทุนผลิต: {formatCurrency(d.costPerUnit)}/ชิ้น</p>
                <p>จำนวนผลิต: {Number(d.outputQty).toLocaleString("th-TH")} ชิ้น</p>
                <hr className="my-1 border-border" />
                <p>รายได้รวม: {formatCurrency(d.totalRevenue)}</p>
                <p>ต้นทุนรวม: {formatCurrency(d.productionCost)}</p>
                <p className={d.profitAmount >= 0 ? "text-success font-light" : "text-danger font-light"}>
                  กำไร/ขาดทุน: {formatCurrency(d.profitAmount)} ({d.marginLabel})
                </p>
              </div>
            );
          }}
        />
        <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
        <Bar dataKey="profitAmount" radius={[0, 4, 4, 0]}>
          {chartData.map((d, i) => (
            <Cell
              key={i}
              fill={d.profitAmount >= 0 ? "#22c55e" : "#ef4444"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
