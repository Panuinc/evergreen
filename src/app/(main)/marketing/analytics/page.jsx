"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@heroui/react";
import { useMarketingAnalytics } from "@/hooks/useMarketingAnalytics";
import RevenueTrendChart from "@/components/charts/RevenueTrendChart";
import MonthlySalesChart from "@/components/charts/MonthlySalesChart";
import DailyTrendChart from "@/components/charts/DailyTrendChart";
import TopCustomersChart from "@/components/charts/TopCustomersChart";
import TopSkuChart from "@/components/charts/TopSkuChart";
import OrderStatusChart from "@/components/charts/OrderStatusChart";
import DataTable from "@/components/ui/DataTable";

const STATUS_COLORS = {
  Open: "warning",
  Released: "success",
};

const ORDER_COLUMNS = [
  { name: "เลขที่", uid: "No", sortable: true },
  { name: "ลูกค้า", uid: "Sell_to_Customer_Name", sortable: true },
  { name: "วันที่สั่ง", uid: "Order_Date", sortable: true },
  { name: "สถานะ", uid: "Status", sortable: true },
  { name: "ยอดรวม", uid: "totalAmount", sortable: true },
  { name: "จัดส่ง", uid: "shipStatus" },
];

const INITIAL_VISIBLE = ["No", "Sell_to_Customer_Name", "Order_Date", "Status", "totalAmount", "shipStatus"];

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
  const { orders, stats, loading, reload } = useMarketingAnalytics();
  const router = useRouter();

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "No":
        return (
          <button
            className="text-primary underline text-left"
            onClick={() => router.push(`/marketing/analytics/${encodeURIComponent(item.No)}`)}
          >
            {item.No}
          </button>
        );
      case "Order_Date":
        return item.Order_Date
          ? new Date(item.Order_Date).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-";
      case "Status":
        return (
          <Chip size="sm" variant="flat" color={STATUS_COLORS[item.Status] || "default"}>
            {item.Status}
          </Chip>
        );
      case "totalAmount":
        return (
          <span className="block text-right font-medium">
            {(item.totalAmount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        );
      case "shipStatus":
        return item.Completely_Shipped ? (
          <Chip size="sm" variant="flat" color="success">จัดส่งแล้ว</Chip>
        ) : (
          <Chip size="sm" variant="flat" color="default">รอจัดส่ง</Chip>
        );
      default:
        return item[columnKey] || "-";
    }
  }, [router]);

  const tableData = useMemo(() => orders, [orders]);

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

      {/* Period KPIs: DTD / MTD / YTD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PeriodCard
          title="วันนี้ (DTD)"
          revenue={stats.dtd?.revenue}
          orders={stats.dtd?.orders || 0}
          icon={CalendarDays}
          color="text-primary"
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

      {/* Summary KPIs */}
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

      {/* Charts — Tabbed Revenue View + Order Status */}
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
              <Tab key="daily" title="รายวัน (เดือนนี้)">
                <DailyTrendChart data={stats.dailyTrend} />
              </Tab>
            </Tabs>
          </CardBody>
        </Card>

        <Card shadow="sm">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">สถานะออเดอร์</p>
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
          </CardBody>
        </Card>
      </div>

      {/* Charts Row 2 — Top Customers + Top SKU */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Orders DataTable */}
      <div>
        <DataTable
          columns={ORDER_COLUMNS}
          data={tableData}
          renderCell={renderCell}
          rowKey="No"
          initialVisibleColumns={INITIAL_VISIBLE}
          searchPlaceholder="ค้นหาเลขที่, ชื่อลูกค้า..."
          searchKeys={["No", "Sell_to_Customer_Name"]}
          defaultRowsPerPage={15}
          defaultSortDescriptor={{ column: "Order_Date", direction: "descending" }}
          emptyContent="ไม่พบออเดอร์"
        />
      </div>
    </div>
  );
}
