"use client";

import { Card, CardBody, Chip, Spinner, Tabs, Tab } from "@heroui/react";
import {
  ShoppingCart,
  DollarSign,
  Truck,
  RefreshCw,
  CalendarDays,
  CalendarRange,
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@heroui/react";
import { useMarketingAnalytics } from "@/hooks/useMarketingAnalytics";
import RevenueTrendChart from "@/components/charts/RevenueTrendChart";
import MonthlySalesChart from "@/components/charts/MonthlySalesChart";
import DailyTrendChart from "@/components/charts/DailyTrendChart";
import RevenueByDayChart from "@/components/charts/RevenueByDayChart";
import TopCustomersChart from "@/components/charts/TopCustomersChart";
import TopSkuChart from "@/components/charts/TopSkuChart";
import OrderStatusChart from "@/components/charts/OrderStatusChart";
import FulfillmentChart from "@/components/charts/FulfillmentChart";
import LocationDistChart from "@/components/charts/LocationDistChart";
import OrderValueDistChart from "@/components/charts/OrderValueDistChart";
import MonthlyComparisonTable from "@/components/charts/MonthlyComparisonTable";
import CustomerInsightsCard from "@/components/charts/CustomerInsightsCard";
import ChannelDistChart from "@/components/charts/ChannelDistChart";
import CustomerGroupChart from "@/components/charts/CustomerGroupChart";
import ProjectTypeChart from "@/components/charts/ProjectTypeChart";

function formatCurrency(value) {
  return `฿${Number(value || 0).toLocaleString("th-TH")}`;
}

function formatCompact(value) {
  if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `฿${(value / 1_000).toFixed(0)}K`;
  return `฿${value}`;
}

function GrowthBadge({ value }) {
  if (value === null || value === undefined) return <span className="text-xs text-default-400">—</span>;
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? "text-success" : "text-danger"}`}>
      <Icon size={12} />
      {isPositive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

function KpiCard({ title, value, sub, icon: Icon, color, growth }) {
  return (
    <Card shadow="sm">
      <CardBody className="p-5 gap-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-default-500 uppercase tracking-wide">{title}</p>
          <div className={`p-2 rounded-lg bg-default-100 ${color}`}>
            <Icon size={16} />
          </div>
        </div>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <div className="flex items-center gap-2 mt-1">
          {growth !== undefined && <GrowthBadge value={growth} />}
          <p className="text-xs text-default-400">{sub}</p>
        </div>
      </CardBody>
    </Card>
  );
}

function PeriodCard({ title, revenue, orders, icon: Icon, color, growth, prevLabel }) {
  return (
    <Card shadow="sm">
      <CardBody className="p-5 gap-1">
        <div className="flex items-center justify-between">
          <p className="text-xs text-default-500 uppercase tracking-wide">{title}</p>
          <div className={`p-2 rounded-lg bg-default-100 ${color}`}>
            <Icon size={16} />
          </div>
        </div>
        <p className="text-2xl font-bold mt-1">{formatCurrency(revenue)}</p>
        <div className="flex items-center gap-2 mt-1">
          {growth !== undefined && <GrowthBadge value={growth} />}
          <span className="text-xs text-default-400">{prevLabel}</span>
        </div>
        <p className="text-xs text-default-400 mt-1">{orders} ออเดอร์</p>
      </CardBody>
    </Card>
  );
}

export default function MarketingAnalyticsPage() {
  const { stats, loading, reload } = useMarketingAnalytics();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-default-400 text-center py-10">ไม่สามารถโหลดข้อมูลได้</p>;
  }

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sales Analytics</h2>
          <p className="text-xs text-default-400">Online Channel — Business Central</p>
        </div>
        <Button variant="bordered" size="sm" radius="md" startContent={<RefreshCw size={14} />} onPress={reload}>
          รีเฟรช
        </Button>
      </div>

      {/* ROW 2: Period KPIs — DTD / WTD / MTD / YTD */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <PeriodCard
          title="วันนี้ (DTD)"
          revenue={stats.dtd?.revenue}
          orders={stats.dtd?.orders || 0}
          icon={CalendarDays}
          color="text-primary"
        />
        <PeriodCard
          title="สัปดาห์นี้ (WTD)"
          revenue={stats.wtd?.revenue}
          orders={stats.wtd?.orders || 0}
          icon={CalendarCheck}
          color="text-secondary"
          growth={stats.wowGrowth}
          prevLabel="vs สัปดาห์ก่อน"
        />
        <PeriodCard
          title="เดือนนี้ (MTD)"
          revenue={stats.mtd?.revenue}
          orders={stats.mtd?.orders || 0}
          icon={CalendarRange}
          color="text-success"
          growth={stats.mtdGrowth}
          prevLabel="vs เดือนก่อน"
        />
        <PeriodCard
          title="ปีนี้ (YTD)"
          revenue={stats.ytd?.revenue}
          orders={stats.ytd?.orders || 0}
          icon={Calendar}
          color="text-warning"
          growth={stats.ytdGrowth}
          prevLabel="vs ปีก่อน"
        />
      </div>

      {/* ROW 3: Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="ออเดอร์ทั้งหมด"
          value={stats.totalOrders.toLocaleString()}
          sub="รายการ"
          icon={ShoppingCart}
          color="text-primary"
        />
        <KpiCard
          title="ยอดขายรวม"
          value={formatCompact(stats.totalRevenue)}
          sub="บาท"
          icon={DollarSign}
          color="text-success"
        />
        <KpiCard
          title="Avg. Order Value"
          value={formatCurrency(Math.round(stats.avgOrderValue))}
          sub="ต่อออเดอร์"
          icon={BarChart3}
          color="text-secondary"
        />
        <KpiCard
          title="อัตราจัดส่ง"
          value={stats.totalOrders ? `${((stats.shippedOrders / stats.totalOrders) * 100).toFixed(0)}%` : "0%"}
          sub={`${stats.shippedOrders} / ${stats.totalOrders}`}
          icon={Truck}
          color="text-warning"
        />
      </div>

      {/* ROW 4: Main Charts — Revenue Tabs + Status/Fulfillment/Location Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card shadow="sm" className="lg:col-span-2">
          <CardBody className="p-5">
            <Tabs variant="underlined" size="sm" classNames={{ tabList: "mb-3" }}>
              <Tab key="trend" title="Revenue Trend">
                <RevenueTrendChart data={stats.monthlyTrend} />
              </Tab>
              <Tab key="monthly" title="รายเดือน">
                <MonthlySalesChart data={stats.monthlyTrend} />
              </Tab>
              <Tab key="daily" title="รายวัน">
                <DailyTrendChart data={stats.dailyTrend} />
              </Tab>
              <Tab key="dow" title="ตามวัน">
                <RevenueByDayChart data={stats.revenueByDayOfWeek} />
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody className="p-5">
            <Tabs variant="underlined" size="sm" classNames={{ tabList: "mb-3" }}>
              <Tab key="status" title="สถานะ">
                <OrderStatusChart data={stats.orderStatusDist} />
                <div className="flex justify-center gap-6 mt-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-success">{stats.shippedOrders}</p>
                    <p className="text-xs text-default-400">จัดส่งแล้ว</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-warning">{stats.pendingOrders}</p>
                    <p className="text-xs text-default-400">รอจัดส่ง</p>
                  </div>
                </div>
              </Tab>
              <Tab key="fulfillment" title="Fulfillment">
                <FulfillmentChart data={stats.fulfillmentMetrics} />
              </Tab>
              <Tab key="location" title="คลังสินค้า">
                <LocationDistChart data={stats.locationDist} />
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>

      {/* ROW 5: Analytical Insights — Order Value Dist + Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="sm">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">การกระจายมูลค่าออเดอร์</p>
            <OrderValueDistChart data={stats.orderValueDist} />
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">เปรียบเทียบรายเดือน</p>
            <MonthlyComparisonTable data={stats.monthlyComparison} />
          </CardBody>
        </Card>
      </div>

      {/* ROW 6: Customer Segmentation — Channel / Group / Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card shadow="sm">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">ช่องทางลูกค้า</p>
              <Chip size="sm" variant="flat">{stats.customerSegmentation?.totalCustomers || 0} ราย</Chip>
            </div>
            <ChannelDistChart data={stats.customerSegmentation?.byChannel} />
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">กลุ่มลูกค้า</p>
            <CustomerGroupChart data={stats.customerSegmentation?.byGroup} />
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">ประเภทงาน</p>
            <ProjectTypeChart data={stats.customerSegmentation?.byType} />
          </CardBody>
        </Card>
      </div>

      {/* ROW 7: Customer & Product Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card shadow="sm">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">Customer Insights</p>
            <CustomerInsightsCard data={stats.customerInsights} />
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Top 10 ลูกค้า</p>
              <Chip size="sm" variant="flat">ตามยอดขาย</Chip>
            </div>
            <TopCustomersChart data={stats.topCustomers} />
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Top 10 SKU</p>
              <Chip size="sm" variant="flat">ตามยอดขาย</Chip>
            </div>
            <TopSkuChart data={stats.topSkus} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
