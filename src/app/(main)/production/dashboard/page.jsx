"use client";

import { Card, CardBody, Spinner } from "@heroui/react";
import {
  Factory,
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
  Warehouse,
  Package,
  BoxSelect,
  MapPin,
} from "lucide-react";
import { useProductionDashboard } from "@/hooks/production/useProductionDashboard";
import ProductionDailyTrendChart from "@/components/charts/ProductionDailyTrendChart";
import ProductionMonthlyCompareChart from "@/components/charts/ProductionMonthlyCompareChart";
import CostByProductionLineChart from "@/components/charts/CostByProductionLineChart";
import TopConsumedItemsChart from "@/components/charts/TopConsumedItemsChart";
import TopOutputItemsChart from "@/components/charts/TopOutputItemsChart";
import ProductionCostByOrderChart from "@/components/charts/ProductionCostByOrderChart";
import CostByProjectChart from "@/components/charts/CostByProjectChart";
import ConsumptionByLocationChart from "@/components/charts/ConsumptionByLocationChart";
import CostByOperatorChart from "@/components/charts/CostByOperatorChart";
import TopSourceProductsChart from "@/components/charts/TopSourceProductsChart";

function formatCurrency(value) {
  return `฿${Number(value).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

export default function ProductionDashboardPage() {
  const { stats, loading } = useProductionDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <p className="text-default-400 text-center py-10">
        ไม่สามารถโหลดข้อมูลแดชบอร์ดได้
      </p>
    );
  }

  const cards = [
    {
      title: "ใบสั่งผลิต",
      value: stats.totalOrders.toLocaleString("th-TH"),
      sub: "ใบสั่งทั้งหมด",
      icon: Factory,
      color: "text-primary",
    },
    {
      title: "เบิกวัตถุดิบ",
      value: stats.consumptionCount.toLocaleString("th-TH"),
      sub: "รายการ Consumption",
      icon: ArrowDownToLine,
      color: "text-warning",
    },
    {
      title: "ผลผลิต",
      value: stats.outputCount.toLocaleString("th-TH"),
      sub: "รายการ Output",
      icon: ArrowUpFromLine,
      color: "text-success",
    },
    {
      title: "วัตถุดิบ",
      value: stats.uniqueMaterials.toLocaleString("th-TH"),
      sub: "รายการที่ใช้",
      icon: Package,
      color: "text-cyan-500",
    },
    {
      title: "สินค้าสำเร็จรูป",
      value: stats.uniqueFG.toLocaleString("th-TH"),
      sub: "รายการที่ผลิต",
      icon: BoxSelect,
      color: "text-emerald-500",
    },
    {
      title: "ต้นทุนวัตถุดิบ",
      value: formatCurrency(stats.totalConsumptionCost),
      sub: "รวมทั้งหมด",
      icon: DollarSign,
      color: "text-danger",
    },
    {
      title: "มูลค่าผลผลิต",
      value: formatCurrency(stats.totalOutputCost),
      sub: "รวมทั้งหมด",
      icon: DollarSign,
      color: "text-secondary",
    },
    {
      title: "คลังที่ใช้งาน",
      value: stats.totalLocations,
      sub: "คลังสินค้า",
      icon: MapPin,
      color: "text-default-500",
    },
  ];

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card
            key={card.title}
            shadow="none"
            className="border border-default-200"
          >
            <CardBody className="p-4 gap-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-default-500">{card.title}</p>
                <card.icon size={18} className={card.color} />
              </div>
              <p className="text-xl font-bold">{card.value}</p>
              <p className="text-xs text-default-400">{card.sub}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ═══ Charts ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Row 1: Daily Trend — full width */}
        <Card
          shadow="none"
          className="border border-default-200 lg:col-span-2"
        >
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              แนวโน้มรายวัน (เบิกวัตถุดิบ vs ผลผลิต)
            </p>
            <ProductionDailyTrendChart data={stats.dailyTrend} />
          </CardBody>
        </Card>

        {/* Row 2: Monthly Comparison | Cost by Production Line */}
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              เปรียบเทียบรายเดือน
            </p>
            <ProductionMonthlyCompareChart data={stats.monthlyComparison} />
          </CardBody>
        </Card>

        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              ต้นทุนตามสายการผลิต (Dim1)
            </p>
            <CostByProductionLineChart data={stats.costByLine} />
          </CardBody>
        </Card>

        {/* Row 3: Top Materials | Top FG Output */}
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              Top 10 วัตถุดิบต้นทุนสูงสุด
            </p>
            <TopConsumedItemsChart data={stats.topMaterials} />
          </CardBody>
        </Card>

        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              Top 10 สินค้าสำเร็จรูปผลิตมากสุด
            </p>
            <TopOutputItemsChart data={stats.topOutputItems} />
          </CardBody>
        </Card>

        {/* Row 4: Cost by Project | Cost by Order */}
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              ต้นทุนตามโครงการ (Dim2)
            </p>
            <CostByProjectChart data={stats.costByProject} />
          </CardBody>
        </Card>

        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              Top 10 ใบสั่งผลิตต้นทุนสูงสุด
            </p>
            <ProductionCostByOrderChart data={stats.costByOrder} />
          </CardBody>
        </Card>

        {/* Row 5: Consumption by Location | Cost by Operator */}
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              การเบิกตามคลัง
            </p>
            <ConsumptionByLocationChart data={stats.consumptionByLocation} />
          </CardBody>
        </Card>

        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              ต้นทุนตามผู้บันทึก
            </p>
            <CostByOperatorChart data={stats.byOperator} />
          </CardBody>
        </Card>

        {/* Row 6: Source FG Products → Material Cost — full width */}
        <Card
          shadow="none"
          className="border border-default-200 lg:col-span-2"
        >
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              Top 15 สินค้าสำเร็จรูปที่ใช้วัตถุดิบมากสุด (ต้นทุน)
            </p>
            <TopSourceProductsChart data={stats.topSourceProducts} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
