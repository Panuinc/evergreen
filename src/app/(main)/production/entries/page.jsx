"use client";

import { useCallback } from "react";
import { Chip } from "@heroui/react";
import { useProduction } from "@/hooks/production/useProduction";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Entry No", uid: "entryNo", sortable: true },
  { name: "วันที่ลงบัญชี", uid: "postingDate", sortable: true },
  { name: "ประเภท", uid: "entryType", sortable: true },
  { name: "เลขที่เอกสาร", uid: "documentNo", sortable: true },
  { name: "รหัสสินค้า", uid: "itemNo", sortable: true },
  { name: "รายละเอียด", uid: "itemDescription", sortable: true },
  { name: "จำนวน", uid: "quantity", sortable: true },
  { name: "หน่วย", uid: "unitOfMeasureCode" },
  { name: "ต้นทุนจริง", uid: "costAmountActual", sortable: true },
  { name: "คลัง", uid: "locationCode", sortable: true },
  { name: "Bin", uid: "binCode" },
  { name: "Lot No", uid: "lotNo" },
  { name: "Serial No", uid: "serialNo" },
  { name: "คงเหลือ", uid: "remainingQuantity", sortable: true },
  { name: "แผนก", uid: "globalDimension1Code", sortable: true },
  { name: "โครงการ", uid: "globalDimension2Code", sortable: true },
  { name: "พนักงาน", uid: "employeeCode" },
  { name: "ชื่อพนักงาน", uid: "employeeName" },
  { name: "ผู้สร้าง", uid: "createdBy" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "entryNo",
  "postingDate",
  "entryType",
  "documentNo",
  "itemNo",
  "itemDescription",
  "quantity",
  "costAmountActual",
  "locationCode",
];

const entryTypeColorMap = {
  Consumption: "warning",
  Output: "success",
  "Positive Adjmt.": "primary",
  "Negative Adjmt.": "danger",
  Transfer: "secondary",
  Sale: "default",
  Purchase: "default",
};

export default function ProductionEntriesPage() {
  const { data, loading } = useProduction();

  const renderCell = useCallback((row, columnKey) => {
    switch (columnKey) {
      case "postingDate":
        return row[columnKey]
          ? new Date(row[columnKey]).toLocaleDateString("th-TH")
          : "-";
      case "entryType":
        return row.entryType ? (
          <Chip
            size="sm"
            variant="flat"
            color={entryTypeColorMap[row.entryType] || "default"}
          >
            {row.entryType}
          </Chip>
        ) : (
          "-"
        );
      case "quantity":
      case "remainingQuantity":
        return row[columnKey] != null
          ? Number(row[columnKey]).toLocaleString("th-TH")
          : "-";
      case "costAmountActual":
        return row[columnKey] != null
          ? Number(row[columnKey]).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      case "itemDescription":
        return (
          <span className="max-w-[300px] truncate block">
            {row[columnKey] || "-"}
          </span>
        );
      default:
        return row[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วย Entry No, เลขที่เอกสาร, รหัสสินค้า, รายละเอียด..."
        searchKeys={[
          "entryNo",
          "documentNo",
          "itemNo",
          "itemDescription",
          "locationCode",
          "employeeCode",
          "employeeName",
          "createdBy",
        ]}
        emptyContent="ไม่พบข้อมูลรายการเคลื่อนไหว"
        statusField="entryType"
        statusOptions={[
          { uid: "Consumption", name: "Consumption" },
          { uid: "Output", name: "Output" },
        ]}
      />
    </div>
  );
}
