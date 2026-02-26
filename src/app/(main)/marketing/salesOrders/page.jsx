"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Chip, Spinner, Tabs, Tab } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { Button } from "@heroui/react";
import { getSalesOrders } from "@/actions/marketing";
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

export default function MarketingSalesOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shipFilter, setShipFilter] = useState("all");
  const router = useRouter();

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getSalesOrders();
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "No":
        return (
          <button
            className="text-primary underline text-left"
            onClick={() => router.push(`/marketing/salesOrders/${encodeURIComponent(item.No)}`)}
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
          <Chip variant="bordered" size="md" radius="md" color={STATUS_COLORS[item.Status] || "default"}>
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
          <Chip variant="bordered" size="md" radius="md" color="success">จัดส่งแล้ว</Chip>
        ) : (
          <Chip variant="bordered" size="md" radius="md" color="default">รอจัดส่ง</Chip>
        );
      default:
        return item[columnKey] || "-";
    }
  }, [router]);

  const tableData = useMemo(() => {
    if (shipFilter === "all") return orders;
    if (shipFilter === "shipped") return orders.filter((o) => o.Completely_Shipped);
    return orders.filter((o) => !o.Completely_Shipped);
  }, [orders, shipFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">คำสั่งขาย</h2>
          <p className="text-xs text-default-400">ช่องทางออนไลน์ — Business Central</p>
        </div>
        <Button variant="bordered" size="md" radius="md" startContent={<RefreshCw size={14} />} onPress={loadOrders}>
          รีเฟรช
        </Button>
      </div>

      <Tabs
        selectedKey={shipFilter}
        onSelectionChange={setShipFilter}
        variant="bordered"
        size="md"
        radius="md"
      >
        <Tab key="all" title="ทั้งหมด" />
        <Tab key="pending" title="รอจัดส่ง" />
        <Tab key="shipped" title="จัดส่งแล้ว" />
      </Tabs>

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
  );
}
