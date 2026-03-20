"use client";

import { useCallback } from "react";
import DataTable from "@/components/ui/dataTable";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

const columns = [
  { name: "รหัสเจ้าหนี้", uid: "vendorNumber", sortable: true },
  { name: "ชื่อเจ้าหนี้", uid: "name", sortable: true },
  { name: "สกุลเงิน", uid: "currencyCode", sortable: true },
  { name: "ปัจจุบัน", uid: "currentAmount", sortable: true },
  { name: "ค้าง 1-30 วัน", uid: "period1Amount", sortable: true },
  { name: "ค้าง 31-60 วัน", uid: "period2Amount", sortable: true },
  { name: "ค้าง 61+ วัน", uid: "period3Amount", sortable: true },
  { name: "ยอดค้างชำระ", uid: "balanceDue", sortable: true },
];

const initialVisibleColumns = [
  "vendorNumber",
  "name",
  "currentAmount",
  "period1Amount",
  "period2Amount",
  "period3Amount",
  "balanceDue",
];

export default function AgedPayablesView({ data, loading }) {
  const renderCell = useCallback((item, key) => {
    switch (key) {
      case "vendorNumber":
        return <span className="font-mono">{item.vendorNumber}</span>;
      case "name":
        return <span className="font-light">{item.name}</span>;
      case "currencyCode":
        return <span className="text-muted-foreground">{item.currencyCode || "-"}</span>;
      case "currentAmount":
        return <span className="text-success">{fmt(Math.abs(item.currentAmount))}</span>;
      case "period1Amount":
        return <span className="text-warning">{fmt(Math.abs(item.period1Amount))}</span>;
      case "period2Amount":
        return <span className="text-warning">{fmt(Math.abs(item.period2Amount))}</span>;
      case "period3Amount":
        return <span className="text-danger">{fmt(Math.abs(item.period3Amount))}</span>;
      case "balanceDue":
        return <span className="font-light">{fmt(Math.abs(item.balanceDue))}</span>;
      default:
        return item[key] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
        rowKey="vendorNumber"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหารหัสหรือชื่อเจ้าหนี้..."
        searchKeys={["vendorNumber", "name"]}
        defaultSortDescriptor={{ column: "balanceDue", direction: "descending" }}
        emptyContent="ไม่พบข้อมูลเจ้าหนี้ค้างชำระ"
        enableCardView
      />
    </div>
  );
}
