"use client";

import { useCallback } from "react";
import DataTable from "@/components/ui/dataTable";
import type { AgedPayable, AgedPayablesViewProps } from "@/modules/finance/types";

function fmt(v: number | null | undefined) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

const columns = [
  { name: "รหัสเจ้าหนี้", uid: "bcVendorLedgerEntryVendorNo", sortable: true },
  { name: "ชื่อเจ้าหนี้", uid: "bcVendorLedgerEntryVendorName", sortable: true },
  { name: "สกุลเงิน", uid: "bcVendorLedgerEntryCurrencyCode", sortable: true },
  { name: "ปัจจุบัน", uid: "currentAmount", sortable: true },
  { name: "ค้าง 1-30 วัน", uid: "period1Amount", sortable: true },
  { name: "ค้าง 31-60 วัน", uid: "period2Amount", sortable: true },
  { name: "ค้าง 61+ วัน", uid: "period3Amount", sortable: true },
  { name: "ยอดค้างชำระ", uid: "bcVendorLedgerEntryRemainingAmount", sortable: true },
];

const initialVisibleColumns = [
  "bcVendorLedgerEntryVendorNo",
  "bcVendorLedgerEntryVendorName",
  "currentAmount",
  "period1Amount",
  "period2Amount",
  "period3Amount",
  "bcVendorLedgerEntryRemainingAmount",
];

export default function AgedPayablesView({ data, loading }: AgedPayablesViewProps) {
  const renderCell = useCallback((item: AgedPayable, key: string) => {
    switch (key) {
      case "bcVendorLedgerEntryVendorNo":
        return <span className="font-mono">{item.bcVendorLedgerEntryVendorNo}</span>;
      case "bcVendorLedgerEntryVendorName":
        return <span className="font-light">{item.bcVendorLedgerEntryVendorName}</span>;
      case "bcVendorLedgerEntryCurrencyCode":
        return <span className="text-muted-foreground">{item.bcVendorLedgerEntryCurrencyCode || "-"}</span>;
      case "currentAmount":
        return <span className="text-success">{fmt(Math.abs(item.currentAmount))}</span>;
      case "period1Amount":
        return <span className="text-warning">{fmt(Math.abs(item.period1Amount))}</span>;
      case "period2Amount":
        return <span className="text-warning">{fmt(Math.abs(item.period2Amount))}</span>;
      case "period3Amount":
        return <span className="text-danger">{fmt(Math.abs(item.period3Amount))}</span>;
      case "bcVendorLedgerEntryRemainingAmount":
        return <span className="font-light">{fmt(Math.abs(item.bcVendorLedgerEntryRemainingAmount))}</span>;
      default:
        return (item as unknown as Record<string, unknown>)[key]?.toString() || "-";
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
        defaultSortDescriptor={{ column: "bcVendorLedgerEntryRemainingAmount", direction: "descending" }}
        emptyContent="ไม่พบข้อมูลเจ้าหนี้ค้างชำระ"
        enableCardView
      />
    </div>
  );
}
