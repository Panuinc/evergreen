"use client";

import { Card, Spinner } from "@heroui/react";
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

export default function ReportsView({ data, loading }) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  const kpis = data.kpis || {};

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">รายงานการขาย</h1>
      </div>

      {/* Full-width Pipeline Chart */}
      <Card shadow="none" className="border border-default-200 p-4">
        <p className="text-lg font-semibold mb-4">วิเคราะห์ไปป์ไลน์</p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.pipelineByStage || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip formatter={(v) => `฿${v.toLocaleString()}`} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
              {(data.pipelineByStage || []).map((entry, i) => (
                <Cell key={i} fill={entry.color || "#3b82f6"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Revenue Trend */}
      <Card shadow="none" className="border border-default-200 p-4">
        <p className="text-lg font-semibold mb-4">แนวโน้มรายได้</p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data.revenueByMonth || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => `฿${v.toLocaleString()}`} />
            <Bar
              dataKey="revenue"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Win/Loss and Salespeople side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card shadow="none" className="border border-default-200 p-4">
          <p className="text-lg font-semibold mb-4">อัตราการชนะ</p>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-5xl font-bold text-success">
                {kpis.winRate || 0}%
              </p>
              <p className="text-default-500 mt-2">
                ชนะ: {kpis.wonDeals || 0} | แพ้: {kpis.lostDeals || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card shadow="none" className="border border-default-200 p-4">
          <p className="text-lg font-semibold mb-4">พนักงานขายยอดเยี่ยม</p>
          <div className="flex flex-col gap-3">
            {(data.topSalespeople || []).map((person, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg border border-default-100"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-default-400 w-6">
                    #{i + 1}
                  </span>
                  <span className="font-medium">{person.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-default-500">
                    {person.deals} ดีล
                  </span>
                  <span className="font-semibold">
                    ฿{Number(person.revenue || 0).toLocaleString("th-TH")}
                  </span>
                </div>
              </div>
            ))}
            {(!data.topSalespeople || data.topSalespeople.length === 0) && (
              <p className="text-default-400 text-sm text-center py-4">
                ไม่มีข้อมูล
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
