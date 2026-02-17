"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, CardBody, Chip, Spinner } from "@heroui/react";
import { ShoppingCart, DollarSign, Truck, Clock, RefreshCw } from "lucide-react";
import { Button } from "@heroui/react";
import { useMarketingAnalytics } from "@/hooks/useMarketingAnalytics";
import MonthlySalesChart from "@/components/charts/MonthlySalesChart";
import TopCustomersChart from "@/components/charts/TopCustomersChart";
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

export default function MarketingAnalyticsPage() {
  const { orders, stats, loading, reload } = useMarketingAnalytics();
  const [expandedOrder, setExpandedOrder] = useState(null);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "No":
        return (
          <button
            className="text-primary underline text-left"
            onClick={() => setExpandedOrder(expandedOrder === item.No ? null : item.No)}
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
  }, [expandedOrder]);

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
    { title: "จำนวนออเดอร์", value: stats.totalOrders, sub: "รายการ", icon: ShoppingCart, color: "text-primary" },
    { title: "ยอดขายรวม", value: `฿${Number(stats.totalRevenue).toLocaleString("th-TH")}`, sub: "บาท", icon: DollarSign, color: "text-success" },
    { title: "จัดส่งแล้ว", value: stats.shippedOrders, sub: "ออเดอร์", icon: Truck, color: "text-secondary" },
    { title: "รอจัดส่ง", value: stats.pendingOrders, sub: "ออเดอร์", icon: Clock, color: "text-warning" },
  ];

  // Find expanded order's lines
  const expandedLines = expandedOrder
    ? orders.find((o) => o.No === expandedOrder)?.lines || []
    : [];

  return (
    <div className="flex flex-col w-full h-full gap-6 overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sales Analytics (Online)</h2>
        <Button variant="bordered" size="sm" radius="md" startContent={<RefreshCw size={14} />} onPress={reload}>
          รีเฟรช
        </Button>
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

      {/* Charts */}
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

      {/* Expanded Lines */}
      {expandedOrder && expandedLines.length > 0 && (
        <Card shadow="sm" className="border border-primary-200">
          <CardBody className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">รายการสินค้า — {expandedOrder}</p>
              <Button size="sm" variant="light" onPress={() => setExpandedOrder(null)}>
                ปิด
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-default-200">
                    <th className="text-left py-2 px-3 text-default-500 font-medium">รหัส</th>
                    <th className="text-left py-2 px-3 text-default-500 font-medium">รายละเอียด</th>
                    <th className="text-right py-2 px-3 text-default-500 font-medium">จำนวน</th>
                    <th className="text-right py-2 px-3 text-default-500 font-medium">ราคา/หน่วย</th>
                    <th className="text-right py-2 px-3 text-default-500 font-medium">ยอดรวม</th>
                    <th className="text-right py-2 px-3 text-default-500 font-medium">ส่งแล้ว</th>
                    <th className="text-right py-2 px-3 text-default-500 font-medium">คงค้าง</th>
                  </tr>
                </thead>
                <tbody>
                  {expandedLines.map((line) => (
                    <tr key={line.Line_No} className="border-b border-default-100">
                      <td className="py-2 px-3">{line.No || "-"}</td>
                      <td className="py-2 px-3">{line.Description || "-"}</td>
                      <td className="py-2 px-3 text-right">{line.Quantity || 0}</td>
                      <td className="py-2 px-3 text-right">
                        {(line.Unit_Price || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {(line.Line_Amount || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 px-3 text-right">{line.Quantity_Shipped || 0}</td>
                      <td className="py-2 px-3 text-right">{line.BWK_Outstanding_Quantity || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
