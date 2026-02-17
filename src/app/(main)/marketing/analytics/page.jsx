"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, Chip, Spinner } from "@heroui/react";
import { ShoppingCart, DollarSign, Truck, Clock, RefreshCw, CalendarDays, CalendarRange, Calendar } from "lucide-react";
import { Button } from "@heroui/react";
import { useMarketingAnalytics } from "@/hooks/useMarketingAnalytics";
import MonthlySalesChart from "@/components/charts/MonthlySalesChart";
import TopCustomersChart from "@/components/charts/TopCustomersChart";
import TopSkuChart from "@/components/charts/TopSkuChart";
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

  const kpiCards = [
    { title: "จำนวนออเดอร์", value: stats.totalOrders, sub: "รายการทั้งหมด", icon: ShoppingCart, color: "text-primary" },
    { title: "ยอดขายรวม", value: formatCurrency(stats.totalRevenue), sub: "ทั้งหมด", icon: DollarSign, color: "text-success" },
    { title: "จัดส่งแล้ว", value: stats.shippedOrders, sub: "ออเดอร์", icon: Truck, color: "text-secondary" },
    { title: "รอจัดส่ง", value: stats.pendingOrders, sub: "ออเดอร์", icon: Clock, color: "text-warning" },
  ];

  const periodCards = [
    { title: "วันนี้ (DTD)", value: formatCurrency(stats.dtd?.revenue), sub: `${stats.dtd?.orders || 0} ออเดอร์`, icon: CalendarDays, color: "text-primary" },
    { title: "เดือนนี้ (MTD)", value: formatCurrency(stats.mtd?.revenue), sub: `${stats.mtd?.orders || 0} ออเดอร์`, icon: CalendarRange, color: "text-success" },
    { title: "ปีนี้ (YTD)", value: formatCurrency(stats.ytd?.revenue), sub: `${stats.ytd?.orders || 0} ออเดอร์`, icon: Calendar, color: "text-warning" },
  ];

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sales Analytics (Online)</h2>
        <Button variant="bordered" size="sm" radius="md" startContent={<RefreshCw size={14} />} onPress={reload}>
          รีเฟรช
        </Button>
      </div>

      {/* DTD / MTD / YTD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {periodCards.map((card) => (
          <Card key={card.title} shadow="sm">
            <CardBody className="p-5 gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-default-500">{card.title}</p>
                <card.icon size={20} className={card.color} />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-default-400">{card.sub}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title} shadow="sm">
            <CardBody className="p-5 gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-default-500">{card.title}</p>
                <card.icon size={20} className={card.color} />
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-default-400">{card.sub}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card shadow="sm">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">ยอดขายรายเดือน</p>
            <MonthlySalesChart data={stats.monthlySales} />
          </CardBody>
        </Card>
        <Card shadow="sm">
          <CardBody className="p-5">
            <p className="text-sm font-semibold mb-3">Top 10 ลูกค้า</p>
            <TopCustomersChart data={stats.topCustomers} />
          </CardBody>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <Card shadow="sm">
        <CardBody className="p-5">
          <p className="text-sm font-semibold mb-3">Top 10 SKU (ตามยอดขาย)</p>
          <TopSkuChart data={stats.topSkus} />
        </CardBody>
      </Card>

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
