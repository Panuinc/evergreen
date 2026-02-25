"use client";

import { Card, CardBody, Spinner } from "@heroui/react";
import {
  Factory,
  DollarSign,
  Package,
  BoxSelect,
  Clock,
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
import UnitCostAnalysisChart from "@/components/charts/UnitCostAnalysisChart";
import YieldRateChart from "@/components/charts/YieldRateChart";
import CostVarianceChart from "@/components/charts/CostVarianceChart";
import ProductionHeatmapChart from "@/components/charts/ProductionHeatmapChart";
import OrderBreakdownTable from "@/components/charts/OrderBreakdownTable";
import WipSummaryChart from "@/components/charts/WipSummaryChart";
import BinAnalysisChart from "@/components/charts/BinAnalysisChart";

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
      unit: "ใบ",
      sub: "ใบสั่งทั้งหมด",
      icon: Factory,
      color: "text-primary",
    },
{
      title: "วัตถุดิบ",
      value: stats.uniqueMaterials.toLocaleString("th-TH"),
      unit: "รายการ",
      sub: "ที่ใช้ทั้งหมด",
      icon: Package,
      color: "text-cyan-500",
    },
    {
      title: "สินค้าสำเร็จรูป",
      value: stats.uniqueFG.toLocaleString("th-TH"),
      unit: "รายการ",
      sub: "ที่ผลิตทั้งหมด",
      icon: BoxSelect,
      color: "text-emerald-500",
    },
    {
      title: "ต้นทุนวัตถุดิบ",
      value: formatCurrency(stats.totalConsumptionCost),
      unit: "บาท",
      sub: "รวมทั้งหมด",
      icon: DollarSign,
      color: "text-danger",
    },
    {
      title: "มูลค่าผลผลิต",
      value: formatCurrency(stats.totalOutputCost),
      unit: "บาท",
      sub: "รวมทั้งหมด",
      icon: DollarSign,
      color: "text-secondary",
    },
{
      title: "WIP ค้าง",
      value: (stats.wipCount || 0).toLocaleString("th-TH"),
      unit: "รายการ",
      sub: "รอดำเนินการ",
      icon: Clock,
      color: "text-amber-500",
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
              <p className="text-xl font-bold">{card.value} <span className="text-sm font-normal text-default-400">{card.unit}</span></p>
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

        {/* Row 7: Yield Rate — full width */}
        <Card
          shadow="none"
          className="border border-default-200 lg:col-span-2"
        >
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              Yield Rate — ต้นทุนวัตถุดิบ vs มูลค่าผลผลิต (Top 15 ใบสั่ง)
            </p>
            <YieldRateChart data={stats.yieldByOrder} />
          </CardBody>
        </Card>

        {/* Row 8: Unit Cost Analysis | Cost Variance */}
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              ต้นทุนต่อหน่วยผลผลิต (Top 15)
            </p>
            <UnitCostAnalysisChart data={stats.unitCostAnalysis} />
          </CardBody>
        </Card>

        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              Expected vs Actual Cost (Top 15)
            </p>
            <CostVarianceChart data={stats.costVariance} />
          </CardBody>
        </Card>

        {/* Row 9: Production Heatmap | Bin Analysis */}
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              ปริมาณการผลิตตามวันในสัปดาห์
            </p>
            <ProductionHeatmapChart data={stats.productionHeatmap} />
          </CardBody>
        </Card>

        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              การกระจายตาม Bin Code
            </p>
            <BinAnalysisChart data={stats.binAnalysis} />
          </CardBody>
        </Card>

        {/* Row 10: WIP Summary — full width */}
        <Card
          shadow="none"
          className="border border-default-200 lg:col-span-2"
        >
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              WIP — รายการค้างดำเนินการ (Top 15)
            </p>
            <WipSummaryChart data={stats.wipItems} />
          </CardBody>
        </Card>

        {/* Row 11: Order Breakdown Table — full width */}
        <Card
          shadow="none"
          className="border border-default-200 lg:col-span-2"
        >
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">
              รายละเอียดใบสั่งผลิต Top 10 (BOM Breakdown)
            </p>
            <OrderBreakdownTable data={stats.orderBreakdown} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
