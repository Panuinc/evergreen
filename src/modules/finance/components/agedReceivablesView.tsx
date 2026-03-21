"use client";

import { useCallback } from "react";
import DataTable from "@/components/ui/dataTable";
import type { AgedReceivable, AgedReceivablesViewProps } from "@/modules/finance/types";

function fmt(v: number | null | undefined) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

const columns = [
  { name: "รหัสลูกค้า", uid: "bcCustomerLedgerEntryCustomerNo", sortable: true },
  { name: "ชื่อลูกค้า", uid: "bcCustomerNameValue", sortable: true },
  { name: "สกุลเงิน", uid: "bcCustomerLedgerEntryCurrencyCode", sortable: true },
  { name: "ปัจจุบัน", uid: "currentAmount", sortable: true },
  { name: "ค้าง 1-30 วัน", uid: "period1Amount", sortable: true },
  { name: "ค้าง 31-60 วัน", uid: "period2Amount", sortable: true },
  { name: "ค้าง 61+ วัน", uid: "period3Amount", sortable: true },
  { name: "ยอดค้างชำระ", uid: "bcCustomerLedgerEntryRemainingAmount", sortable: true },
];

const initialVisibleColumns = [
  "bcCustomerLedgerEntryCustomerNo",
  "bcCustomerNameValue",
  "currentAmount",
  "period1Amount",
  "period2Amount",
  "period3Amount",
  "bcCustomerLedgerEntryRemainingAmount",
];

export default function AgedReceivablesView({ data, loading }: AgedReceivablesViewProps) {
  const renderCell = useCallback((item: AgedReceivable, key: string) => {
    switch (key) {
      case "bcCustomerLedgerEntryCustomerNo":
        return <span className="font-mono">{item.bcCustomerLedgerEntryCustomerNo}</span>;
      case "bcCustomerNameValue":
        return <span className="font-light">{item.bcCustomerNameValue}</span>;
      case "bcCustomerLedgerEntryCurrencyCode":
        return <span className="text-muted-foreground">{item.bcCustomerLedgerEntryCurrencyCode || "-"}</span>;
      case "currentAmount":
        return <span className="text-success">{fmt(item.currentAmount)}</span>;
      case "period1Amount":
        return <span className="text-warning">{fmt(item.period1Amount)}</span>;
      case "period2Amount":
        return <span className="text-warning">{fmt(item.period2Amount)}</span>;
      case "period3Amount":
        return <span className="text-danger">{fmt(item.period3Amount)}</span>;
      case "bcCustomerLedgerEntryRemainingAmount":
        return <span className="font-light">{fmt(item.bcCustomerLedgerEntryRemainingAmount)}</span>;
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
        rowKey="bcCustomerLedgerEntryCustomerNo"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหารหัสหรือชื่อลูกค้า..."
        searchKeys={["bcCustomerLedgerEntryCustomerNo", "bcCustomerNameValue"]}
        defaultSortDescriptor={{ column: "bcCustomerLedgerEntryRemainingAmount", direction: "descending" }}
        emptyContent="ไม่พบข้อมูลลูกหนี้ค้างชำระ"
        enableCardView
      />
    </div>
  );
}
