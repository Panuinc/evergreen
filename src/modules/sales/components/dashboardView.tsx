import { Card } from "@heroui/react";
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
import CompareToggle from "@/components/ui/compareToggle";
import CompareKpiCard from "@/components/ui/compareKpiCard";
import Loading from "@/components/ui/loading";
import type {
  DashboardViewProps,
  SalesDashboardData,
  SalesDashboardCompareData,
  SalesKPIs,
} from "@/modules/sales/types";

const typeIconMap: Record<string, React.ElementType> = {
  task: ClipboardList,
  call: Phone,
  meeting: Calendar,
  email: Mail,
};

export default function DashboardView({ data, loading, compareMode, setCompareMode }: DashboardViewProps) {
  if (loading || !data) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  const isCompare = !!(data as SalesDashboardCompareData).compareMode;
  const compareData = data as SalesDashboardCompareData;
  const simpleData = data as SalesDashboardData;

  const emptyKpis: Partial<SalesKPIs> = {};
  const kpis: Partial<SalesKPIs> = isCompare ? compareData.current?.kpis ?? emptyKpis : simpleData.kpis ?? emptyKpis;
  const prevKpis: Partial<SalesKPIs> | null = isCompare ? compareData.previous?.kpis ?? null : null;
  const pipelineByStage = isCompare ? compareData.current?.pipelineByStage : simpleData.pipelineByStage;
  const revenueByMonth = isCompare ? compareData.current?.revenueByMonth : simpleData.revenueByMonth;
  const topSalespeople = isCompare ? compareData.current?.topSalespeople : simpleData.topSalespeople;
  const recentActivities = isCompare ? compareData.current?.recentActivities : simpleData.recentActivities;

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {}
      {setCompareMode && (
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            {isCompare && compareData.labels && (
              <span className="text-xs text-muted-foreground">
                {compareData.labels.current} vs {compareData.labels.previous}
              </span>
            )}
            <CompareToggle value={compareMode} onChange={setCompareMode} />
          </div>
        </div>
      )}

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CompareKpiCard
          title="ลีดทั้งหมด"
          value={kpis.totalLeads || 0}
          icon={<Users />}
          currentRaw={prevKpis ? kpis.totalLeads : undefined}
          previousRaw={prevKpis?.totalLeads}
        />
        <CompareKpiCard
          title="โอกาสที่เปิดอยู่"
          value={kpis.openOpportunities || 0}
          icon={<Briefcase />}
          currentRaw={prevKpis ? kpis.openOpportunities : undefined}
          previousRaw={prevKpis?.openOpportunities}
        />
        <CompareKpiCard
          title="ดีลที่ชนะ"
          value={kpis.wonDeals || 0}
          icon={<Trophy />}
          currentRaw={prevKpis ? kpis.wonDeals : undefined}
          previousRaw={prevKpis?.wonDeals}
        />
        <CompareKpiCard
          title="รายได้ทั้งหมด"
          value={`฿${Number(kpis.totalRevenue || 0).toLocaleString("th-TH")}`}
          icon={<DollarSign />}
          currentRaw={prevKpis ? kpis.totalRevenue : undefined}
          previousRaw={prevKpis?.totalRevenue}
        />
        <CompareKpiCard
          title="มูลค่าไปป์ไลน์"
          value={`฿${Number(kpis.pipelineValue || 0).toLocaleString("th-TH")}`}
          icon={<TrendingUp />}
          currentRaw={prevKpis ? kpis.pipelineValue : undefined}
          previousRaw={prevKpis?.pipelineValue}
        />
        <CompareKpiCard
          title="ไปป์ไลน์ถ่วงน้ำหนัก"
          value={`฿${Number(kpis.weightedPipeline || 0).toLocaleString("th-TH")}`}
          icon={<BarChart3 />}
          currentRaw={prevKpis ? kpis.weightedPipeline : undefined}
          previousRaw={prevKpis?.weightedPipeline}
        />
        <CompareKpiCard
          title="อัตราการชนะ"
          value={`${kpis.winRate || 0}%`}
          icon={<Target />}
          currentRaw={prevKpis ? kpis.winRate : undefined}
          previousRaw={prevKpis?.winRate}
        />
        <CompareKpiCard
          title="ลีดใหม่"
          value={kpis.newLeads || 0}
          icon={<UserPlus />}
          currentRaw={prevKpis ? kpis.newLeads : undefined}
          previousRaw={prevKpis?.newLeads}
        />
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {}
        <Card shadow="none" className="border border-border p-4">
          <p className="text-xs font-light mb-4">ไปป์ไลน์ตามขั้นตอน</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineByStage || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="salesOpportunityStage" />
              <YAxis />
              <Tooltip
                formatter={(v: number) => `฿${v.toLocaleString()}`}
              />
              <Bar dataKey="salesOpportunityAmount" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                {(pipelineByStage || []).map((entry, i) => (
                  <Cell key={i} fill={entry.salesPipelineStageColor || "#3b82f6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {}
        <Card shadow="none" className="border border-border p-4">
          <p className="text-xs font-light mb-4">รายได้ตามเดือน</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(v: number) => `฿${v.toLocaleString()}`}
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

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {}
        <Card shadow="none" className="border border-border p-4">
          <p className="text-xs font-light mb-4">พนักงานขายยอดเยี่ยม</p>
          <div className="flex flex-col gap-3">
            {(topSalespeople || []).map((person, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-light text-muted-foreground w-6">
                    #{i + 1}
                  </span>
                  <span className="font-light">{person.salesOrderCreatedBy}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">
                    {person.salesOrderCount} ดีล
                  </span>
                  <span className="font-light">
                    ฿{Number(person.revenue || 0).toLocaleString("th-TH")}
                  </span>
                </div>
              </div>
            ))}
            {(!topSalespeople || topSalespeople.length === 0) && (
              <p className="text-muted-foreground text-xs text-center py-4">
                ไม่มีข้อมูล
              </p>
            )}
          </div>
        </Card>

        {}
        <Card shadow="none" className="border border-border p-4">
          <p className="text-xs font-light mb-4">กิจกรรมล่าสุด</p>
          <div className="flex flex-col gap-3">
            {(recentActivities || []).map((activity, i) => {
              const Icon = typeIconMap[activity.salesActivityType] || ClipboardList;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between p-2 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="text-muted-foreground" />
                    <span className="font-light">
                      {activity.salesActivitySubject}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {activity.salesActivityDueDate
                      ? new Date(activity.salesActivityDueDate).toLocaleDateString(
                          "th-TH",
                        )
                      : "-"}
                  </span>
                </div>
              );
            })}
            {(!recentActivities ||
              recentActivities.length === 0) && (
              <p className="text-muted-foreground text-xs text-center py-4">
                ไม่มีกิจกรรมล่าสุด
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
