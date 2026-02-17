"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Chip, Spinner } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { Button } from "@heroui/react";
import { useMarketingAnalytics } from "@/hooks/useMarketingAnalytics";
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
  const { orders, loading, reload } = useMarketingAnalytics();
  const router = useRouter();

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

  return (
    <div className="flex flex-col w-full gap-6 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sales Orders</h2>
          <p className="text-xs text-default-400">Online Channel — Business Central</p>
        </div>
        <Button variant="bordered" size="sm" radius="md" startContent={<RefreshCw size={14} />} onPress={reload}>
          รีเฟรช
        </Button>
      </div>

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
