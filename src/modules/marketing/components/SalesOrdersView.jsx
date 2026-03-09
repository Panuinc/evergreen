import { useCallback, useMemo } from "react";
import { Chip, Tabs, Tab } from "@heroui/react";
import { RefreshCw } from "lucide-react";
import { Button } from "@heroui/react";
import DataTable from "@/components/ui/DataTable";
import { useRBAC } from "@/contexts/RBACContext";
import Loading from "@/components/ui/Loading";

const STATUS_COLORS = {
  Open: "warning",
  Released: "success",
};

const BASE_ORDER_COLUMNS = [
  { name: "เลขที่", uid: "bcSalesOrderNumber", sortable: true },
  { name: "ลูกค้า", uid: "bcSalesOrderCustomerName", sortable: true },
  { name: "วันที่สั่ง", uid: "bcSalesOrderDate", sortable: true },
  { name: "สถานะ", uid: "bcSalesOrderStatus", sortable: true },
  { name: "ยอดรวม", uid: "bcSalesOrderTotalAmountIncVat", sortable: true },
  { name: "จัดส่ง", uid: "bcSalesOrderCompletelyShipped" },
];

const INITIAL_VISIBLE = ["bcSalesOrderNumber", "bcSalesOrderCustomerName", "bcSalesOrderDate", "bcSalesOrderStatus", "bcSalesOrderTotalAmountIncVat", "bcSalesOrderCompletelyShipped"];

export default function SalesOrdersView({
  orders,
  loading,
  shipFilter,
  setShipFilter,
  reload,
  onNavigateToOrder,
}) {
  const { isSuperAdmin } = useRBAC();

  const ORDER_COLUMNS = useMemo(() => {
    if (isSuperAdmin) {
      return [
        ...BASE_ORDER_COLUMNS,
        { name: "สถานะใช้งาน", uid: "isActive" },
      ];
    }
    return BASE_ORDER_COLUMNS;
  }, [isSuperAdmin]);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "bcSalesOrderNumber":
        return (
          <button
            className="text-primary underline text-left"
            onClick={() => onNavigateToOrder(item.bcSalesOrderNumber)}
          >
            {item.bcSalesOrderNumber}
          </button>
        );
      case "bcSalesOrderDate":
        return item.bcSalesOrderDate
          ? new Date(item.bcSalesOrderDate).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "-";
      case "bcSalesOrderStatus":
        return (
          <Chip variant="flat" size="md" radius="md" color={STATUS_COLORS[item.bcSalesOrderStatus] || "default"}>
            {item.bcSalesOrderStatus}
          </Chip>
        );
      case "bcSalesOrderTotalAmountIncVat":
        return (
          <span className="block text-right font-light">
            {(item.bcSalesOrderTotalAmountIncVat || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
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
          <p className="text-sm font-light">คำสั่งขาย</p>
          <p className="text-sm text-muted-foreground">ช่องทางออนไลน์ — Business Central</p>
        </div>
        <Button variant="bordered" size="md" radius="md" startContent={<RefreshCw size={14} />} onPress={reload}>
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
        data={orders}
        renderCell={renderCell}
        rowKey="bcSalesOrderNumber"
        initialVisibleColumns={INITIAL_VISIBLE}
        searchPlaceholder="ค้นหาเลขที่, ชื่อลูกค้า..."
        searchKeys={["bcSalesOrderNumber", "bcSalesOrderCustomerName"]}
        defaultRowsPerPage={15}
        defaultSortDescriptor={{ column: "bcSalesOrderDate", direction: "descending" }}
        emptyContent="ไม่พบออเดอร์"
        enableCardView
      />
    </div>
  );
}
