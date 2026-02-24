"use client";

import { Card, Spinner } from "@heroui/react";
import {
  Users,
  Briefcase,
  Trophy,
  DollarSign,
  TrendingUp,
  BarChart3,
  Target,
  UserPlus,
  Phone,
  Calendar,
  Mail,
  ClipboardList,
} from "lucide-react";
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
import { useCrmDashboard } from "@/hooks/sales/useCrmDashboard";

const TYPE_ICON_MAP = {
  task: ClipboardList,
  call: Phone,
  meeting: Calendar,
  email: Mail,
};

export default function SalesDashboardPage() {
  const { data, loading } = useCrmDashboard();

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  const kpis = data.kpis || {};

  const kpiCards = [
    {
      label: "ลีดทั้งหมด",
      value: kpis.totalLeads || 0,
      icon: Users,
    },
    {
      label: "โอกาสที่เปิดอยู่",
      value: kpis.openOpportunities || 0,
      icon: Briefcase,
    },
    {
      label: "ดีลที่ชนะ",
      value: kpis.wonDeals || 0,
      icon: Trophy,
    },
    {
      label: "รายได้ทั้งหมด",
      value: `฿${Number(kpis.totalRevenue || 0).toLocaleString("th-TH")}`,
      icon: DollarSign,
    },
    {
      label: "มูลค่าไปป์ไลน์",
      value: `฿${Number(kpis.pipelineValue || 0).toLocaleString("th-TH")}`,
      icon: TrendingUp,
    },
    {
      label: "ไปป์ไลน์ถ่วงน้ำหนัก",
      value: `฿${Number(kpis.weightedPipeline || 0).toLocaleString("th-TH")}`,
      icon: BarChart3,
    },
    {
      label: "อัตราการชนะ",
      value: `${kpis.winRate || 0}%`,
      icon: Target,
    },
    {
      label: "ลีดใหม่",
      value: kpis.newLeads || 0,
      icon: UserPlus,
    },
  ];

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.label} shadow="none" className="border border-default-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <card.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-default-500">{card.label}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pipeline by Stage */}
        <Card shadow="none" className="border border-default-200 p-4">
          <p className="text-lg font-semibold mb-4">ไปป์ไลน์ตามขั้นตอน</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.pipelineByStage || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip
                formatter={(v) => `฿${v.toLocaleString()}`}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {(data.pipelineByStage || []).map((entry, i) => (
                  <Cell key={i} fill={entry.color || "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue by Month */}
        <Card shadow="none" className="border border-default-200 p-4">
          <p className="text-lg font-semibold mb-4">รายได้ตามเดือน</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.revenueByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(v) => `฿${v.toLocaleString()}`}
              />
              <Bar
                dataKey="revenue"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Salespeople */}
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

        {/* Recent Activities */}
        <Card shadow="none" className="border border-default-200 p-4">
          <p className="text-lg font-semibold mb-4">กิจกรรมล่าสุด</p>
          <div className="flex flex-col gap-3">
            {(data.recentActivities || []).map((activity, i) => {
              const Icon =
                TYPE_ICON_MAP[activity.activityType] || ClipboardList;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg border border-default-100"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-default-500" />
                    <span className="font-medium">
                      {activity.activitySubject}
                    </span>
                  </div>
                  <span className="text-sm text-default-500">
                    {activity.activityDueDate
                      ? new Date(activity.activityDueDate).toLocaleDateString(
                          "th-TH",
                        )
                      : "-"}
                  </span>
                </div>
              );
            })}
            {(!data.recentActivities ||
              data.recentActivities.length === 0) && (
              <p className="text-default-400 text-sm text-center py-4">
                ไม่มีกิจกรรมล่าสุด
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
