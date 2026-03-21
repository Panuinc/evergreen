import { useCallback, useMemo } from "react";
import { Chip, Tabs, Tab } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { Button } from "@heroui/react";
import DataTable from "@/components/ui/dataTable";
import { useRBAC } from "@/contexts/rbacContext";
import Loading from "@/components/ui/loading";
import type { SalesOrdersViewProps } from "@/modules/marketing/types";

const statusColors = {
  Open: "warning",
  Released: "success",
};

const baseOrderColumns = [
  { name: "เลขที่", uid: "bcSalesOrderNoValue", sortable: true },
  { name: "ลูกค้า", uid: "bcSalesOrderSellToCustomerName", sortable: true },
  { name: "วันที่สั่ง", uid: "bcSalesOrderOrderDate", sortable: true },
  { name: "สถานะ", uid: "bcSalesOrderStatus", sortable: true },
  { name: "ยอดรวม", uid: "bcSalesOrderAmountIncludingVAT", sortable: true },
  { name: "จัดส่ง", uid: "bcSalesOrderCompletelyShipped" },
];

const initialVisible = ["bcSalesOrderNoValue", "bcSalesOrderSellToCustomerName", "bcSalesOrderOrderDate", "bcSalesOrderStatus", "bcSalesOrderAmountIncludingVAT", "bcSalesOrderCompletelyShipped"];

export default function SalesOrdersView({
  orders,
  loading,
  shipFilter,
  setShipFilter,
  reload,
  onNavigateToOrder,
}: SalesOrdersViewProps) {
  const { isSuperAdmin } = useRBAC();

  const orderColumns = useMemo(() => {
    if (isSuperAdmin) {
      return [
        ...baseOrderColumns,
        { name: "สถานะใช้งาน", uid: "isActive" },
      ];
    }
    return baseOrderColumns;
  }, [isSuperAdmin]);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "bcSalesOrderNoValue":
        return (
          <button
            className="text-primary underline text-left"
            onClick={() => onNavigateToOrder(item.bcSalesOrderNoValue)}
          >
            {item.bcSalesOrderNoValue}
          </button>
        );
      case "bcSalesOrderOrderDate":
        return item.bcSalesOrderOrderDate
          ? new Date(item.bcSalesOrderOrderDate).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-";
      case "bcSalesOrderStatus":
        return (
          <Chip variant="flat" size="md" radius="md" color={statusColors[item.bcSalesOrderStatus] || "default"}>
            {item.bcSalesOrderStatus}
          </Chip>
        );
      case "bcSalesOrderAmountIncludingVAT":
        return (
          <span className="block text-right font-light">
            {(item.bcSalesOrderAmountIncludingVAT || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        );
      case "bcSalesOrderCompletelyShipped":
        return item.bcSalesOrderCompletelyShipped ? (
          <Chip variant="flat" size="md" radius="md" color="success">จัดส่งแล้ว</Chip>
        ) : (
          <Chip variant="flat" size="md" radius="md" color="default">รอจัดส่ง</Chip>
        );
      case "isActive":
        return (
          <Chip
            variant="flat"
            size="md"
            radius="md"
            color={item.isActive ? "success" : "danger"}
          >
            {item.isActive ? "Active" : "Inactive"}
          </Chip>
        );
      default:
        return item[columnKey] || "-";
    }
  }, [onNavigateToOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-light">คำสั่งขาย</p>
          <p className="text-xs text-muted-foreground">ช่องทางออนไลน์ — Business Central</p>
        </div>
        <Button variant="bordered" size="md" radius="md" startContent={<RefreshCw />} onPress={reload}>
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
        columns={orderColumns}
        data={orders}
        renderCell={renderCell}
        rowKey="bcSalesOrderNoValue"
        initialVisibleColumns={initialVisible}
        searchPlaceholder="ค้นหาเลขที่, ชื่อลูกค้า..."
        searchKeys={["bcSalesOrderNoValue", "bcSalesOrderSellToCustomerName"]}
        defaultRowsPerPage={15}
        defaultSortDescriptor={{ column: "bcSalesOrderOrderDate", direction: "descending" }}
        emptyContent="ไม่พบออเดอร์"
        enableCardView
      />
    </div>
  );
}
