"use client";

import { useCallback } from "react";
import { Chip } from "@heroui/react";
import DataTable from "@/components/ui/dataTable";
import type { TrialBalanceAccount, TrialBalanceViewProps } from "@/modules/finance/types";

function parseNum(val: unknown): number {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  return Number(String(val).replace(/,/g, "")) || 0;
}

function fmt(v: number | null | undefined) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function cleanAccountType(type: string | null | undefined) {
  if (!type) return "";
  return type.replace(/_x002D_/g, "-");
}

const columns = [
  { name: "เลขที่บัญชี", uid: "bcGLAccountNo", sortable: true },
  { name: "ชื่อบัญชี", uid: "bcGLAccountNameValue", sortable: true },
  { name: "ประเภท", uid: "bcGLAccountAccountType", sortable: true },
  { name: "ยอดคงเหลือ", uid: "bcGLAccountBalance", sortable: true },
  { name: "เปลี่ยนแปลงสุทธิ", uid: "bcGLAccountNetChange", sortable: true },
  { name: "ยอดเดบิต ณ วันที่", uid: "balanceAtDateDebit", sortable: true },
  { name: "ยอดเครดิต ณ วันที่", uid: "balanceAtDateCredit", sortable: true },
];

const initialVisibleColumns = [
  "bcGLAccountNo",
  "bcGLAccountNameValue",
  "bcGLAccountAccountType",
  "balanceAtDateDebit",
  "balanceAtDateCredit",
];

export default function TrialBalanceView({ data, loading }: TrialBalanceViewProps) {
  const renderCell = useCallback((item: TrialBalanceAccount, key: string) => {
    switch (key) {
      case "bcGLAccountNo":
        return <span className="font-mono">{item.bcGLAccountNo}</span>;
      case "bcGLAccountNameValue":
        return <span className="font-light">{item.bcGLAccountNameValue}</span>;
      case "bcGLAccountAccountType": {
        const cleaned = cleanAccountType(item.bcGLAccountAccountType);
        return (
          <Chip size="md" variant="flat" color={item.bcGLAccountAccountType === "Posting" ? "primary" : "default"}>
            {cleaned}
          </Chip>
        );
      }
      case "bcGLAccountBalance": {
        const v = parseNum(item.bcGLAccountBalance);
        return <span className={v > 0 ? "text-primary" : v < 0 ? "text-danger" : "text-muted-foreground"}>{fmt(v)}</span>;
      }
      case "bcGLAccountNetChange": {
        const v = parseNum(item.bcGLAccountNetChange);
        return <span className={v > 0 ? "text-primary" : v < 0 ? "text-danger" : "text-muted-foreground"}>{fmt(v)}</span>;
      }
      case "balanceAtDateDebit": {
        const v = parseNum(item.balanceAtDateDebit);
        return <span className={v > 0 ? "font-light text-primary" : "text-muted-foreground"}>{fmt(v)}</span>;
      }
      case "balanceAtDateCredit": {
        const v = parseNum(item.balanceAtDateCredit);
        return <span className={v > 0 ? "font-light text-danger" : "text-muted-foreground"}>{fmt(v)}</span>;
      }
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
        rowKey="bcGLAccountNo"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาเลขที่หรือชื่อบัญชี..."
        searchKeys={["bcGLAccountNo", "bcGLAccountNameValue"]}
        defaultSortDescriptor={{ column: "bcGLAccountNo", direction: "ascending" }}
        emptyContent="ไม่พบข้อมูลงบทดลอง"
        enableCardView
      />
    </div>
  );
}
