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
import { useCrmDashboard } from "@/hooks/useCrmDashboard";

export default function SalesReportsPage() {
  const { data, loading } = useCrmDashboard();

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const kpis = data.kpis || {};

  return (
    <div className="flex flex-col w-full h-full gap-4 p-2">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Sales Reports</h1>
      </div>

      {/* Full-width Pipeline Chart */}
      <Card className="p-4">
        <p className="text-lg font-semibold mb-4">Pipeline Analysis</p>
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
      <Card className="p-4">
        <p className="text-lg font-semibold mb-4">Revenue Trend</p>
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
        <Card className="p-4">
          <p className="text-lg font-semibold mb-4">Win Rate</p>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-5xl font-bold text-success">
                {kpis.winRate || 0}%
              </p>
              <p className="text-default-500 mt-2">
                Won: {kpis.wonDeals || 0} | Lost: {kpis.lostDeals || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-lg font-semibold mb-4">Top Salespeople</p>
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
                    {person.deals} deals
                  </span>
                  <span className="font-semibold">
                    ฿{Number(person.revenue || 0).toLocaleString("th-TH")}
                  </span>
                </div>
              </div>
            ))}
            {(!data.topSalespeople || data.topSalespeople.length === 0) && (
              <p className="text-default-400 text-sm text-center py-4">
                No data available
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
