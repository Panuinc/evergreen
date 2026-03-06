"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#3b82f6", "#e5e7eb"];

function formatCurrency(value) {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `฿${(value / 1_000).toFixed(0)}K`;
  return `฿${value}`;
}

export default function CustomerInsightsCard({ data }) {
  if (!data) {
    return <p className="text-sm text-muted-foreground text-center py-8">ไม่มีข้อมูล</p>;
  }

  const pieData = [
    { name: "ลูกค้าซ้ำ", value: data.repeatCustomers },
    { name: "ลูกค้าครั้งเดียว", value: data.singleOrderCustomers },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="text-center">
          <p className="text-2xl font-semibold text-primary">{data.repeatCustomerRate}%</p>
          <p className="text-sm text-muted-foreground">Repeat Rate</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-semibold text-warning">{data.top5ConcentrationPct}%</p>
          <p className="text-sm text-muted-foreground">Top 5% Revenue Share</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={65}
            paddingAngle={4}
            dataKey="value"
          >
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value} ราย`, name]} />
        </PieChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 gap-2 w-full text-sm text-center">
        <div>
          <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1" />
          <span className="text-muted-foreground">ซ้ำ {data.repeatCustomers} ราย</span>
          <p className="text-muted-foreground">{formatCurrency(data.repeatCustomerRevenue)}</p>
        </div>
        <div>
          <span className="inline-block w-2 h-2 rounded-full bg-default-300 mr-1" />
          <span className="text-muted-foreground">ครั้งเดียว {data.singleOrderCustomers} ราย</span>
          <p className="text-muted-foreground">{formatCurrency(data.singleCustomerRevenue)}</p>
        </div>
      </div>
    </div>
  );
}
