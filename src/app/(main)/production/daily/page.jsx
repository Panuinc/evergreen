"use client";

import { useCallback, useMemo } from "react";
import { Chip } from "@heroui/react";
import { useProductionDaily } from "@/hooks/production/useProductionDaily";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "วันที่", uid: "postingDate", sortable: true },
  { name: "ประเภท", uid: "entryType", sortable: true },
  { name: "เลขที่ใบสั่ง", uid: "orderNo", sortable: true },
  { name: "เลขที่เอกสาร", uid: "documentNo", sortable: true },
  { name: "เลขที่สินค้า", uid: "itemNo", sortable: true },
  { name: "รายละเอียด", uid: "description", sortable: true },
  { name: "จำนวน", uid: "quantity", sortable: true },
  { name: "หน่วย", uid: "unitOfMeasureCode", sortable: true },
  { name: "ต้นทุนจริง", uid: "costAmountActual", sortable: true },
  { name: "คลัง", uid: "locationCode", sortable: true },
  { name: "สายการผลิต", uid: "dim1", sortable: true },
  { name: "โครงการ", uid: "dim2", sortable: true },
  { name: "FG ต้นทาง", uid: "sourceDescription", sortable: true },
  { name: "ผู้บันทึก", uid: "createdBy", sortable: true },
  { name: "สถานะ", uid: "open", sortable: true },
  { name: "Entry No.", uid: "entryNo", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "postingDate",
  "entryType",
  "orderNo",
  "itemNo",
  "description",
  "quantity",
  "unitOfMeasureCode",
  "costAmountActual",
  "locationCode",
  "dim1",
  "createdBy",
];

function fmt(v) {
  return `฿${Number(v).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

export default function ProductionDailyPage() {
  const { entries, loading } = useProductionDaily();

  const statusOptions = useMemo(
    () => [
      { uid: "Consumption", name: "Consumption" },
      { uid: "Output", name: "Output" },
    ],
    [],
  );

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "postingDate":
        return item.postingDate
          ? new Date(item.postingDate).toLocaleDateString("th-TH", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "2-digit",
            })
          : "-";
      case "entryType":
        return (
          <Chip
            variant="flat"
            size="sm"
            radius="md"
            color={item.entryType === "Consumption" ? "warning" : "secondary"}
          >
            {item.entryType === "Consumption" ? "เบิกวัตถุดิบ" : "ผลผลิต"}
          </Chip>
        );
      case "orderNo":
        return (
          <span className="font-mono text-sm">{item.orderNo || "-"}</span>
        );
      case "documentNo":
        return (
          <span className="font-mono text-sm">{item.documentNo || "-"}</span>
        );
      case "itemNo":
        return (
          <span className="font-mono text-sm font-medium">
            {item.itemNo || "-"}
          </span>
        );
      case "description":
        return (
          <span className="font-medium">{item.description || "-"}</span>
        );
      case "quantity": {
        const qty = item.quantity;
        return (
          <span
            className={`font-medium ${qty > 0 ? "text-success" : qty < 0 ? "text-danger" : ""}`}
          >
            {qty.toLocaleString("th-TH")}
          </span>
        );
      }
      case "costAmountActual": {
        const cost = item.costAmountActual;
        return (
          <span
            className={`font-medium ${item.entryType === "Consumption" ? "text-danger" : "text-success"}`}
          >
            {fmt(cost)}
          </span>
        );
      }
      case "dim1":
        return item.dim1 !== "-" ? (
          <Chip variant="bordered" size="sm" radius="md" color="secondary">
            {item.dim1}
          </Chip>
        ) : (
          "-"
        );
      case "dim2":
        return item.dim2 !== "-" ? (
          <Chip variant="bordered" size="sm" radius="md" color="primary">
            {item.dim2}
          </Chip>
        ) : (
          "-"
        );
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
      case "entryNo":
        return (
          <span className="font-mono text-xs text-default-400">
            {item.entryNo}
          </span>
        );
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
        statusOptions={statusOptions}
        filterLabel="ประเภท"
        searchPlaceholder="ค้นหาเลขที่สินค้า, รายละเอียด, ใบสั่ง, เอกสาร..."
        searchKeys={[
          "itemNo",
          "description",
          "orderNo",
          "documentNo",
          "sourceDescription",
          "createdBy",
        ]}
        emptyContent="ไม่พบรายการเบิก/ผลิตประจำวัน"
      />
    </div>
  );
}
