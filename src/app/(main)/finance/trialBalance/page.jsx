"use client";

import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { getTrialBalance } from "@/actions/finance";
import { Chip } from "@heroui/react";
import DataTable from "@/components/ui/DataTable";

// BC returns numbers as comma-formatted strings like "4,857.97"
function parseNum(val) {
  if (val === "" || val === null || val === undefined) return 0;
  if (typeof val === "number") return val;
  return Number(String(val).replace(/,/g, "")) || 0;
}

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

function cleanAccountType(type) {
  if (!type) return "";
  return type.replace(/_x002D_/g, "-");
}

const columns = [
  { name: "เลขที่บัญชี", uid: "number", sortable: true },
  { name: "ชื่อบัญชี", uid: "display", sortable: true },
  { name: "ประเภท", uid: "accountType", sortable: true },
  { name: "เดบิตรวม", uid: "totalDebit", sortable: true },
  { name: "เครดิตรวม", uid: "totalCredit", sortable: true },
  { name: "ยอดเดบิต ณ วันที่", uid: "balanceAtDateDebit", sortable: true },
  { name: "ยอดเครดิต ณ วันที่", uid: "balanceAtDateCredit", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "display",
  "accountType",
  "balanceAtDateDebit",
  "balanceAtDateCredit",
];

export default function TrialBalancePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrialBalance()
      .then(setData)
      .catch(() => toast.error("โหลดงบทดลองล้มเหลว"))
      .finally(() => setLoading(false));
  }, []);

  const renderCell = useCallback((item, key) => {
    switch (key) {
      case "number":
        return <span className="font-mono">{item.number}</span>;
      case "display":
        return <span className="font-medium">{item.display}</span>;
      case "accountType": {
        const cleaned = cleanAccountType(item.accountType);
        return (
          <Chip size="sm" variant="flat" color={item.accountType === "Posting" ? "primary" : "default"}>
            {cleaned}
          </Chip>
        );
      }
      case "totalDebit": {
        const v = parseNum(item.totalDebit);
        return <span className={v > 0 ? "text-primary" : "text-default-400"}>{fmt(v)}</span>;
      }
      case "totalCredit": {
        const v = parseNum(item.totalCredit);
        return <span className={v > 0 ? "text-danger" : "text-default-400"}>{fmt(v)}</span>;
      }
      case "balanceAtDateDebit": {
        const v = parseNum(item.balanceAtDateDebit);
        return <span className={v > 0 ? "font-medium text-primary" : "text-default-400"}>{fmt(v)}</span>;
      }
      case "balanceAtDateCredit": {
        const v = parseNum(item.balanceAtDateCredit);
        return <span className={v > 0 ? "font-medium text-danger" : "text-default-400"}>{fmt(v)}</span>;
      }
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
        rowKey="accountId"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาเลขที่หรือชื่อบัญชี..."
        searchKeys={["number", "display"]}
        defaultSortDescriptor={{ column: "number", direction: "ascending" }}
        emptyContent="ไม่พบข้อมูลงบทดลอง"
      />
    </div>
  );
}
