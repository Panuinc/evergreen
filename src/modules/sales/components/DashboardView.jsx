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
import CompareToggle from "@/components/ui/CompareToggle";
import CompareKpiCard from "@/components/ui/CompareKpiCard";

const TYPE_ICON_MAP = {
  task: ClipboardList,
  call: Phone,
  meeting: Calendar,
  email: Mail,
};

export default function DashboardView({ data, loading, compareMode, setCompareMode }) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  // Handle comparison data shape
  const isCompare = !!data.compareMode;
  const kpis = isCompare ? data.current?.kpis || {} : data.kpis || {};
  const prevKpis = isCompare ? data.previous?.kpis || {} : null;
  const pipelineByStage = isCompare ? data.current?.pipelineByStage : data.pipelineByStage;
  const revenueByMonth = isCompare ? data.current?.revenueByMonth : data.revenueByMonth;
  const topSalespeople = isCompare ? data.current?.topSalespeople : data.topSalespeople;
  const recentActivities = isCompare ? data.current?.recentActivities : data.recentActivities;

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Compare Toggle */}
      {setCompareMode && (
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            {isCompare && data.labels && (
              <span className="text-sm text-muted-foreground">
                {data.labels.current} vs {data.labels.previous}
              </span>
            )}
            <CompareToggle value={compareMode} onChange={setCompareMode} />
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CompareKpiCard
          title="ลีดทั้งหมด"
          value={kpis.totalLeads || 0}
          icon={Users}
          currentRaw={prevKpis ? kpis.totalLeads : undefined}
          previousRaw={prevKpis?.totalLeads}
        />
        <CompareKpiCard
          title="โอกาสที่เปิดอยู่"
          value={kpis.openOpportunities || 0}
          icon={Briefcase}
          currentRaw={prevKpis ? kpis.openOpportunities : undefined}
          previousRaw={prevKpis?.openOpportunities}
        />
        <CompareKpiCard
          title="ดีลที่ชนะ"
          value={kpis.wonDeals || 0}
          icon={Trophy}
          currentRaw={prevKpis ? kpis.wonDeals : undefined}
          previousRaw={prevKpis?.wonDeals}
        />
        <CompareKpiCard
          title="รายได้ทั้งหมด"
          value={`฿${Number(kpis.totalRevenue || 0).toLocaleString("th-TH")}`}
          icon={DollarSign}
          currentRaw={prevKpis ? kpis.totalRevenue : undefined}
          previousRaw={prevKpis?.totalRevenue}
        />
        <CompareKpiCard
          title="มูลค่าไปป์ไลน์"
          value={`฿${Number(kpis.pipelineValue || 0).toLocaleString("th-TH")}`}
          icon={TrendingUp}
          currentRaw={prevKpis ? kpis.pipelineValue : undefined}
          previousRaw={prevKpis?.pipelineValue}
        />
        <CompareKpiCard
          title="ไปป์ไลน์ถ่วงน้ำหนัก"
          value={`฿${Number(kpis.weightedPipeline || 0).toLocaleString("th-TH")}`}
          icon={BarChart3}
          currentRaw={prevKpis ? kpis.weightedPipeline : undefined}
          previousRaw={prevKpis?.weightedPipeline}
        />
        <CompareKpiCard
          title="อัตราการชนะ"
          value={`${kpis.winRate || 0}%`}
          icon={Target}
          currentRaw={prevKpis ? kpis.winRate : undefined}
          previousRaw={prevKpis?.winRate}
        />
        <CompareKpiCard
          title="ลีดใหม่"
          value={kpis.newLeads || 0}
          icon={UserPlus}
          currentRaw={prevKpis ? kpis.newLeads : undefined}
          previousRaw={prevKpis?.newLeads}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pipeline by Stage */}
        <Card shadow="none" className="border border-border p-4">
          <p className="text-lg font-semibold mb-4">ไปป์ไลน์ตามขั้นตอน</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineByStage || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip
                formatter={(v) => `฿${v.toLocaleString()}`}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {(pipelineByStage || []).map((entry, i) => (
                  <Cell key={i} fill={entry.color || "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue by Month */}
        <Card shadow="none" className="border border-border p-4">
          <p className="text-lg font-semibold mb-4">รายได้ตามเดือน</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByMonth || []}>
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
        <Card shadow="none" className="border border-border p-4">
          <p className="text-lg font-semibold mb-4">พนักงานขายยอดเยี่ยม</p>
          <div className="flex flex-col gap-3">
            {(topSalespeople || []).map((person, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-muted-foreground w-6">
                    #{i + 1}
                  </span>
                  <span className="font-medium">{person.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {person.deals} ดีล
                  </span>
                  <span className="font-semibold">
                    ฿{Number(person.revenue || 0).toLocaleString("th-TH")}
                  </span>
                </div>
              </div>
            ))}
            {(!topSalespeople || topSalespeople.length === 0) && (
              <p className="text-muted-foreground text-sm text-center py-4">
                ไม่มีข้อมูล
              </p>
            )}
          </div>
        </Card>

        {/* Recent Activities */}
        <Card shadow="none" className="border border-border p-4">
          <p className="text-lg font-semibold mb-4">กิจกรรมล่าสุด</p>
          <div className="flex flex-col gap-3">
            {(recentActivities || []).map((activity, i) => {
              const Icon =
                TYPE_ICON_MAP[activity.crmActivityType] || ClipboardList;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} className="text-muted-foreground" />
                    <span className="font-medium">
                      {activity.crmActivitySubject}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {activity.crmActivityDueDate
                      ? new Date(activity.crmActivityDueDate).toLocaleDateString(
                          "th-TH",
                        )
                      : "-"}
                  </span>
                </div>
              );
            })}
            {(!recentActivities ||
              recentActivities.length === 0) && (
              <p className="text-muted-foreground text-sm text-center py-4">
                ไม่มีกิจกรรมล่าสุด
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
