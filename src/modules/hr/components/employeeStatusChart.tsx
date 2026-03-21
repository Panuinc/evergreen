"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { EmployeeStatusChartProps, HrStatusStat } from "../types";

const statusColors: Record<string, string> = {
  active: "#22c55e",
  inactive: "#a1a1aa",
  probation: "#f59e0b",
  resigned: "#ef4444",
  terminated: "#dc2626",
  unknown: "#71717a",
};

const statusLabels: Record<string, string> = {
  active: "ปฏิบัติงาน",
  inactive: "ไม่ปฏิบัติงาน",
  probation: "ทดลองงาน",
  resigned: "ลาออก",
  terminated: "เลิกจ้าง",
  unknown: "ไม่ระบุ",
};

interface ChartEntry {
  name: string;
  value: number;
  color: string;
}

export default function EmployeeStatusChart({ data = [] }: EmployeeStatusChartProps) {
  if (!data.length) {
    return (
      <p className="text-xs text-muted-foreground text-center py-8">No data</p>
    );
  }

  const chartData: ChartEntry[] = data.map((d: HrStatusStat) => ({
    name: statusLabels[d.status] || d.status,
    value: d.count,
    color: statusColors[d.status] || "#a1a1aa",
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, "คน"]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
