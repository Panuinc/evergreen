"use client";

import { useCallback } from "react";
import DataTable from "@/components/ui/dataTable";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

const columns = [
  { name: "รหัสลูกค้า", uid: "bcCustomerLedgerEntryCustomerNo", sortable: true },
  { name: "ชื่อลูกค้า", uid: "bcCustomerLedgerEntryCustomerName", sortable: true },
  { name: "สกุลเงิน", uid: "bcCustomerLedgerEntryCurrencyCode", sortable: true },
  { name: "ปัจจุบัน", uid: "current", sortable: true },
  { name: "ค้าง 1-30 วัน", uid: "days1to30", sortable: true },
  { name: "ค้าง 31-60 วัน", uid: "days31to60", sortable: true },
  { name: "ค้าง 61+ วัน", uid: "days61plus", sortable: true },
  { name: "ยอดค้างชำระ", uid: "totalRemaining", sortable: true },
];

const initialVisibleColumns = [
  "bcCustomerLedgerEntryCustomerNo",
  "bcCustomerLedgerEntryCustomerName",
  "current",
  "days1to30",
  "days31to60",
  "days61plus",
  "totalRemaining",
];

export default function AgedReceivablesView({ data, loading }) {
  const renderCell = useCallback((item, key) => {
    switch (key) {
      case "bcCustomerLedgerEntryCustomerNo":
        return <span className="font-mono">{item.bcCustomerLedgerEntryCustomerNo}</span>;
      case "bcCustomerLedgerEntryCustomerName":
        return <span className="font-light">{item.bcCustomerLedgerEntryCustomerName}</span>;
      case "bcCustomerLedgerEntryCurrencyCode":
        return <span className="text-muted-foreground">{item.bcCustomerLedgerEntryCurrencyCode || "-"}</span>;
      case "current":
        return <span className="text-success">{fmt(item.current)}</span>;
      case "days1to30":
        return <span className="text-warning">{fmt(item.days1to30)}</span>;
      case "days31to60":
        return <span className="text-warning">{fmt(item.days31to60)}</span>;
      case "days61plus":
        return <span className="text-danger">{fmt(item.days61plus)}</span>;
      case "totalRemaining":
        return <span className="font-light">{fmt(item.totalRemaining)}</span>;
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
        rowKey="bcCustomerLedgerEntryCustomerNo"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหารหัสหรือชื่อลูกค้า..."
        searchKeys={["bcCustomerLedgerEntryCustomerNo", "bcCustomerLedgerEntryCustomerName"]}
        defaultSortDescriptor={{ column: "totalRemaining", direction: "descending" }}
        emptyContent="ไม่พบข้อมูลลูกหนี้ค้างชำระ"
        enableCardView
      />
    </div>
  );
}
