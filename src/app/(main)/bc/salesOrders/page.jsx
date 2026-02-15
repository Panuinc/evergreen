"use client";

import { useCallback } from "react";
import { Chip } from "@heroui/react";
import { useBcSalesOrders } from "@/hooks/useBcSalesOrders";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Number", uid: "number", sortable: true },
  { name: "Order Date", uid: "orderDate", sortable: true },
  { name: "Customer", uid: "customerName", sortable: true },
  { name: "Status", uid: "status", sortable: true },
  { name: "Currency", uid: "currencyCode", sortable: true },
  { name: "Total (incl. Tax)", uid: "totalAmountIncludingTax", sortable: true },
  { name: "Lines", uid: "lineCount" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "orderDate",
  "customerName",
  "status",
  "currencyCode",
  "totalAmountIncludingTax",
  "lineCount",
];

const statusColorMap = {
  Draft: "default",
  Open: "primary",
  Released: "success",
  "Pending Approval": "warning",
  "Pending Prepayment": "warning",
};

export default function BcSalesOrdersPage() {
  const { salesOrders, loading } = useBcSalesOrders();

  const renderCell = useCallback((order, columnKey) => {
    switch (columnKey) {
      case "number":
        return <span className="font-medium">{order.number}</span>;
      case "orderDate":
        return order.orderDate
          ? new Date(order.orderDate).toLocaleDateString("th-TH")
          : "-";
      case "customerName":
        return order.customerName || "-";
      case "status":
        return (
          <Chip
            variant="bordered"
            size="md"
            radius="md"
            color={statusColorMap[order.status] || "default"}
          >
            {order.status || "-"}
          </Chip>
        );
      case "currencyCode":
        return order.currencyCode || "THB";
      case "totalAmountIncludingTax":
        return order.totalAmountIncludingTax != null
          ? Number(order.totalAmountIncludingTax).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      case "lineCount":
        return order.salesOrderLines?.length ?? "-";
      default:
        return order[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={salesOrders}
        renderCell={renderCell}
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="Search by number, customer..."
        searchKeys={["number", "customerName", "status"]}
        emptyContent="No sales orders found"
      />
    </div>
  );
}
