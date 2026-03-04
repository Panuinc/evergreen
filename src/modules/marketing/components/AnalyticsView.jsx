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
  Search,
} from "lucide-react";
import { Button } from "@heroui/react";
import RevenueTrendChart from "@/modules/marketing/components/RevenueTrendChart";
import MonthlySalesChart from "@/modules/marketing/components/MonthlySalesChart";
import DailyTrendChart from "@/modules/marketing/components/DailyTrendChart";
import RevenueByDayChart from "@/modules/marketing/components/RevenueByDayChart";
import TopCustomersChart from "@/modules/marketing/components/TopCustomersChart";
import TopSkuChart from "@/modules/marketing/components/TopSkuChart";
import OrderStatusChart from "@/modules/marketing/components/OrderStatusChart";
import FulfillmentChart from "@/modules/marketing/components/FulfillmentChart";
import LocationDistChart from "@/modules/marketing/components/LocationDistChart";
import OrderValueDistChart from "@/modules/marketing/components/OrderValueDistChart";
import MonthlyComparisonTable from "@/modules/marketing/components/MonthlyComparisonTable";
import CustomerInsightsCard from "@/modules/marketing/components/CustomerInsightsCard";
import ChannelDistChart from "@/modules/marketing/components/ChannelDistChart";
import CustomerGroupChart from "@/modules/marketing/components/CustomerGroupChart";
import ProjectTypeChart from "@/modules/marketing/components/ProjectTypeChart";
import YoYComparisonChart from "@/modules/marketing/components/YoYComparisonChart";

const PERIODS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "day", label: "วันนี้" },
  { key: "week", label: "สัปดาห์นี้" },
  { key: "month", label: "เดือนนี้" },
  { key: "year", label: "ปีนี้" },
  { key: "custom", label: "กำหนดเอง" },
];

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
    <Card shadow="none" className="border border-default-200">
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
    <Card shadow="none" className="border border-default-200">
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

export default function AnalyticsView({ stats, loading, reload, period, setPeriod, startDate, endDate, setStartDate, setEndDate, searchCustomRange }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-default-400 text-center py-10">ไม่สามารถโหลดข้อมูลได้</p>;
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">วิเคราะห์ยอดขาย</h2>
            <p className="text-xs text-default-400">ช่องทางออนไลน์ — Business Central</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {PERIODS.map((p) => (
                <Button
                  key={p.key}
                  size="md"
                  radius="md"
                  variant={period === p.key ? "solid" : "bordered"}
                  color={period === p.key ? "primary" : "default"}
                  onPress={() => setPeriod(p.key)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <Button variant="bordered" size="md" radius="md" isIconOnly onPress={reload}>
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>
        {period === "custom" && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-default-500">ตั้งแต่</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-default-300 rounded-lg px-3 py-1.5 text-sm bg-transparent focus:outline-none focus:border-primary"
            />
            <label className="text-xs text-default-500">ถึง</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-default-300 rounded-lg px-3 py-1.5 text-sm bg-transparent focus:outline-none focus:border-primary"
            />
            <Button
              size="md"
              radius="md"
              color="primary"
              isDisabled={!startDate || !endDate}
              onPress={searchCustomRange}
              startContent={<Search size={14} />}
            >
              ค้นหา
            </Button>
          </div>
        )}
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
          title="มูลค่าเฉลี่ยต่อออเดอร์"
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
        <Card shadow="none" className="border border-default-200 lg:col-span-2">
          <CardBody className="p-5">
            <Tabs variant="bordered" size="md" radius="md" classNames={{ tabList: "mb-3" }}>
              <Tab key="trend" title="แนวโน้มรายได้">
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
              <Tab key="yoy" title="เทียบ YoY">
                <YoYComparisonChart data={stats.yoyComparison} />
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <Tabs variant="bordered" size="md" radius="md" classNames={{ tabList: "mb-3" }}>
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
              <Tab key="fulfillment" title="การจัดส่ง">
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
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">การกระจายมูลค่าออเดอร์</p>
            <OrderValueDistChart data={stats.orderValueDist} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">เปรียบเทียบรายเดือน</p>
            <MonthlyComparisonTable data={stats.monthlyComparison} />
          </CardBody>
        </Card>
      </div>

      {/* ROW 6: Customer Segmentation — Channel / Group / Type */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">ช่องทางลูกค้า</p>
              <Chip variant="bordered" size="md" radius="md">{stats.customerSegmentation?.totalCustomers || 0} ราย</Chip>
            </div>
            <ChannelDistChart data={stats.customerSegmentation?.byChannel} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">กลุ่มลูกค้า</p>
            <CustomerGroupChart data={stats.customerSegmentation?.byGroup} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">ประเภทงาน</p>
            <ProjectTypeChart data={stats.customerSegmentation?.byType} />
          </CardBody>
        </Card>
      </div>

      {/* ROW 7: Customer & Product Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">ข้อมูลเชิงลึกลูกค้า</p>
            <CustomerInsightsCard data={stats.customerInsights} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Top 10 ลูกค้า</p>
              <Chip variant="bordered" size="md" radius="md">ตามยอดขาย</Chip>
            </div>
            <TopCustomersChart data={stats.topCustomers} />
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-default-200">
          <CardBody className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">Top 10 SKU</p>
              <Chip variant="bordered" size="md" radius="md">ตามยอดขาย</Chip>
            </div>
            <TopSkuChart data={stats.topSkus} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
