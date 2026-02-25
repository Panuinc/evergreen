"use client";

import { Card, CardBody, CardHeader, Spinner } from "@heroui/react";
import { useProductionDashboard } from "@/hooks/production/useProductionDashboard";
import OrdersByStatusChart from "@/components/charts/OrdersByStatusChart";
import OutputByProductGroupChart from "@/components/charts/OutputByProductGroupChart";
import CostByProjectChart from "@/components/charts/CostByProjectChart";
import DailyProductionTrendChart from "@/components/charts/DailyProductionTrendChart";
import TopOutputItemsChart from "@/components/charts/TopOutputItemsChart";
import WipByOrderChart from "@/components/charts/WipByOrderChart";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH");
}

function fmtCurrency(v) {
  return `฿${Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

function KpiCard({ title, value, unit, color = "default" }) {
  const colorClass = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
    default: "",
  };
  return (
    <Card shadow="none" className="border border-default-200">
      <CardBody className="gap-1">
        <p className="text-xs text-default-500">{title}</p>
        <div className="flex items-baseline gap-1">
          <p className={`text-2xl font-bold ${colorClass[color] || ""}`}>{value}</p>
          {unit && <span className="text-xs text-default-400">{unit}</span>}
        </div>
      </CardBody>
    </Card>
  );
}

function ChartCard({ title, children }) {
  return (
    <Card shadow="none" className="border border-default-200">
      <CardHeader className="pb-0">
        <p className="text-sm font-semibold">{title}</p>
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

export default function ProductionDashboardPage() {
  const { data, loading } = useProductionDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col w-full gap-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <KpiCard title="ใบสั่งผลิตทั้งหมด" value={fmt(data.totalOrders)} unit="ใบ" />
        <KpiCard title="Released" value={fmt(data.releasedOrders)} unit="ใบ" color="primary" />
        <KpiCard title="Finished" value={fmt(data.finishedOrders)} unit="ใบ" color="success" />
        <KpiCard title="ผลผลิต FG" value={fmt(data.totalOutputQty)} unit="ชิ้น" color="success" />
        <KpiCard title="ต้นทุนวัตถุดิบ" value={fmtCurrency(data.totalConsumptionCost)} color="warning" />
        <KpiCard title="มูลค่าผลผลิต" value={fmtCurrency(data.totalOutputValue)} color="success" />
        <KpiCard title="WIP" value={fmtCurrency(data.wipValue)} color="danger" />
      </div>

      {/* Row 1: Daily Trend (full width) */}
      <ChartCard title="แนวโน้มการผลิตรายวัน (ต้นทุนวัตถุดิบ vs มูลค่าผลผลิต)">
        <DailyProductionTrendChart data={data.dailyTrend} />
      </ChartCard>

      {/* Row 2: Status + Product Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="สถานะใบสั่งผลิต">
          <OrdersByStatusChart data={data.ordersByStatus} />
        </ChartCard>
        <ChartCard title="ผลผลิต FG ตามกลุ่มสินค้า">
          <OutputByProductGroupChart data={data.outputByProductGroup} />
        </ChartCard>
      </div>

      {/* Row 3: Top Output Items + Cost by Project */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Top 10 สินค้าผลผลิต">
          <TopOutputItemsChart data={data.topOutputItems} />
        </ChartCard>
        <ChartCard title="ต้นทุนตามโครงการ">
          <CostByProjectChart data={data.costByProject} />
        </ChartCard>
      </div>

      {/* Row 4: WIP */}
      <ChartCard title="WIP รายใบสั่งผลิต (Released)">
        <WipByOrderChart data={data.wipByOrder} />
      </ChartCard>
    </div>
  );
}
