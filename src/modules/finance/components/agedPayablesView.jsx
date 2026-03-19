"use client";

import { useCallback } from "react";
import DataTable from "@/components/ui/dataTable";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

const columns = [
  { name: "รหัสเจ้าหนี้", uid: "bcVendorLedgerEntryVendorNo", sortable: true },
  { name: "ชื่อเจ้าหนี้", uid: "bcVendorLedgerEntryVendorName", sortable: true },
  { name: "สกุลเงิน", uid: "bcVendorLedgerEntryCurrencyCode", sortable: true },
  { name: "ปัจจุบัน", uid: "current", sortable: true },
  { name: "ค้าง 1-30 วัน", uid: "days1to30", sortable: true },
  { name: "ค้าง 31-60 วัน", uid: "days31to60", sortable: true },
  { name: "ค้าง 61+ วัน", uid: "days61plus", sortable: true },
  { name: "ยอดค้างชำระ", uid: "totalRemaining", sortable: true },
];

const initialVisibleColumns = [
  "bcVendorLedgerEntryVendorNo",
  "bcVendorLedgerEntryVendorName",
  "current",
  "days1to30",
  "days31to60",
  "days61plus",
  "totalRemaining",
];

export default function AgedPayablesView({ data, loading }) {
  const renderCell = useCallback((item, key) => {
    switch (key) {
      case "bcVendorLedgerEntryVendorNo":
        return <span className="font-mono">{item.bcVendorLedgerEntryVendorNo}</span>;
      case "bcVendorLedgerEntryVendorName":
        return <span className="font-light">{item.bcVendorLedgerEntryVendorName}</span>;
      case "bcVendorLedgerEntryCurrencyCode":
        return <span className="text-muted-foreground">{item.bcVendorLedgerEntryCurrencyCode || "-"}</span>;
      case "current":
        return <span className="text-success">{fmt(Math.abs(item.current))}</span>;
      case "days1to30":
        return <span className="text-warning">{fmt(Math.abs(item.days1to30))}</span>;
      case "days31to60":
        return <span className="text-warning">{fmt(Math.abs(item.days31to60))}</span>;
      case "days61plus":
        return <span className="text-danger">{fmt(Math.abs(item.days61plus))}</span>;
      case "totalRemaining":
        return <span className="font-light">{fmt(Math.abs(item.totalRemaining))}</span>;
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
        rowKey="bcVendorLedgerEntryVendorNo"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหารหัสหรือชื่อเจ้าหนี้..."
        searchKeys={["bcVendorLedgerEntryVendorNo", "bcVendorLedgerEntryVendorName"]}
        defaultSortDescriptor={{ column: "totalRemaining", direction: "descending" }}
        emptyContent="ไม่พบข้อมูลเจ้าหนี้ค้างชำระ"
        enableCardView
      />
    </div>
  );
}
