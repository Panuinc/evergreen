"use client";

import { useCallback } from "react";
import DataTable from "@/components/ui/DataTable";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

const columns = [
  { name: "รหัสลูกค้า", uid: "customerNumber", sortable: true },
  { name: "ชื่อลูกค้า", uid: "name", sortable: true },
  { name: "สกุลเงิน", uid: "currencyCode", sortable: true },
  { name: "ปัจจุบัน", uid: "currentAmount", sortable: true },
  { name: "ค้าง 1 งวด", uid: "period1Amount", sortable: true },
  { name: "ค้าง 2 งวด", uid: "period2Amount", sortable: true },
  { name: "ค้าง 3+ งวด", uid: "period3Amount", sortable: true },
  { name: "ยอดค้างชำระ", uid: "balanceDue", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "customerNumber",
  "name",
  "currentAmount",
  "period1Amount",
  "period2Amount",
  "period3Amount",
  "balanceDue",
];

export default function AgedReceivablesView({ data, loading }) {
  const renderCell = useCallback((item, key) => {
    switch (key) {
      case "customerNumber":
        return <span className="font-mono">{item.customerNumber}</span>;
      case "name":
        return <span className="font-medium">{item.name}</span>;
      case "currencyCode":
        return <span className="text-muted-foreground">{item.currencyCode || "-"}</span>;
      case "currentAmount":
        return <span className="text-success">{fmt(item.currentAmount)}</span>;
      case "period1Amount":
        return <span className="text-warning">{fmt(item.period1Amount)}</span>;
      case "period2Amount":
        return <span className="text-warning">{fmt(item.period2Amount)}</span>;
      case "period3Amount":
        return <span className="text-danger">{fmt(item.period3Amount)}</span>;
      case "balanceDue":
        return <span className="font-semibold">{fmt(item.balanceDue)}</span>;
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
        rowKey="customerId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหารหัสหรือชื่อลูกค้า..."
        searchKeys={["customerNumber", "name"]}
        defaultSortDescriptor={{ column: "balanceDue", direction: "descending" }}
        emptyContent="ไม่พบข้อมูลลูกหนี้ค้างชำระ"
        enableCardView
      />
    </div>
  );
}
