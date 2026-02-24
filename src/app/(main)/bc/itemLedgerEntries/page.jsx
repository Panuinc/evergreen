"use client";

import { useCallback, useMemo } from "react";
import { Chip } from "@heroui/react";
import { useBcItemLedgerEntries } from "@/hooks/bc/useBcItemLedgerEntries";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Entry No.", uid: "entryNo", sortable: true },
  { name: "วันที่ลงบัญชี", uid: "postingDate", sortable: true },
  { name: "ประเภท", uid: "entryType", sortable: true },
  { name: "เลขที่เอกสาร", uid: "documentNo", sortable: true },
  { name: "เลขที่สินค้า", uid: "itemNo", sortable: true },
  { name: "รายละเอียด", uid: "description", sortable: true },
  { name: "คลัง", uid: "locationCode", sortable: true },
  { name: "จำนวน", uid: "quantity", sortable: true },
  { name: "หน่วย", uid: "unitOfMeasureCode", sortable: true },
  { name: "คงเหลือ", uid: "remainingQuantity", sortable: true },
  { name: "ต้นทุนจริง", uid: "costAmountActual", sortable: true },
  { name: "ยอดขาย", uid: "salesAmountActual", sortable: true },
  { name: "ประเภทคำสั่ง", uid: "orderType", sortable: true },
  { name: "เลขที่คำสั่ง", uid: "orderNo", sortable: true },
  { name: "Dimension 1", uid: "globalDimension1Code", sortable: true },
  { name: "Dimension 2", uid: "globalDimension2Code", sortable: true },
  { name: "Bin", uid: "binCode", sortable: true },
  { name: "แหล่งที่มา", uid: "sourceNo", sortable: true },
  { name: "รายละเอียดแหล่งที่มา", uid: "sourceDescription", sortable: true },
  { name: "สร้างโดย", uid: "createdBy", sortable: true },
  { name: "สถานะ", uid: "open", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "entryNo",
  "postingDate",
  "entryType",
  "documentNo",
  "itemNo",
  "description",
  "locationCode",
  "quantity",
  "unitOfMeasureCode",
  "costAmountActual",
  "orderNo",
  "open",
];

const ENTRY_TYPE_COLOR = {
  Purchase: "primary",
  Sale: "success",
  Consumption: "warning",
  Output: "secondary",
  Transfer: "default",
  "Positive Adjmt.": "success",
  "Negative Adjmt.": "danger",
  "Assembly Consumption": "warning",
  "Assembly Output": "secondary",
};

export default function BcItemLedgerEntriesPage() {
  const { entries, loading } = useBcItemLedgerEntries();

  const entryTypeOptions = useMemo(() => {
    const unique = [
      ...new Set(entries.map((e) => e.entryType).filter(Boolean)),
    ];
    return unique.map((v) => ({ uid: v, name: v }));
  }, [entries]);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "entryNo":
        return <span className="font-mono text-sm">{item.entryNo}</span>;
      case "postingDate":
        return item.postingDate
          ? new Date(item.postingDate).toLocaleDateString("th-TH")
          : "-";
      case "entryType":
        return item.entryType ? (
          <Chip
            variant="flat"
            size="sm"
            radius="md"
            color={ENTRY_TYPE_COLOR[item.entryType] || "default"}
          >
            {item.entryType}
          </Chip>
        ) : (
          "-"
        );
      case "quantity": {
        const qty = Number(item.quantity);
        return (
          <span
            className={`font-medium ${qty > 0 ? "text-success" : qty < 0 ? "text-danger" : ""}`}
          >
            {qty.toLocaleString("th-TH")}
          </span>
        );
      }
      case "remainingQuantity": {
        const rem = Number(item.remainingQuantity);
        return (
          <span className={rem > 0 ? "text-primary" : ""}>
            {rem.toLocaleString("th-TH")}
          </span>
        );
      }
      case "costAmountActual":
        return item.costAmountActual != null
          ? Number(item.costAmountActual).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      case "salesAmountActual":
        return item.salesAmountActual != null
          ? Number(item.salesAmountActual).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      case "open":
        return (
          <Chip
            variant="bordered"
            size="sm"
            radius="md"
            color={item.open ? "warning" : "success"}
          >
            {item.open ? "เปิด" : "ปิด"}
          </Chip>
        );
      case "description":
        return <span className="font-medium">{item.description || "-"}</span>;
      default:
        return item[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={entries}
        renderCell={renderCell}
        enableCardView
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        statusField="entryType"
        statusOptions={entryTypeOptions}
        filterLabel="ประเภทรายการ"
        searchPlaceholder="ค้นหาด้วยเลขที่สินค้า, เอกสาร, รายละเอียด..."
        searchKeys={["itemNo", "documentNo", "description", "orderNo", "sourceDescription"]}
        emptyContent="ไม่พบรายการเคลื่อนไหวสินค้า"
      />
    </div>
  );
}
