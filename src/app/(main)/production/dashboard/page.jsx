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
  { name: "สถานะใบสั่งผลิต", uid: "orderStatus", sortable: true },
  { name: "เลขที่ใบสั่งผลิต", uid: "orderNo", sortable: true },
  { name: "รายละเอียดใบสั่งผลิต", uid: "orderDescription" },
  { name: "สินค้าที่ผลิต", uid: "sourceNo", sortable: true },
  { name: "จำนวนสั่งผลิต", uid: "orderQuantity", sortable: true },
  { name: "กำหนดส่ง", uid: "dueDate", sortable: true },
  { name: "แผนก", uid: "dimension1Code", sortable: true },
  { name: "โครงการ", uid: "dimension2Code", sortable: true },
  { name: "ผู้รับผิดชอบ", uid: "assignedUserId", sortable: true },
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
  "orderStatus",
  "orderNo",
  "dueDate",
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

const statusColorMap = {
  Released: "primary",
  Finished: "success",
  Planned: "default",
  "Firm Planned": "warning",
};

export default function ProductionDashboardPage() {
  const { data, loading } = useProduction();

  const renderCell = useCallback((row, columnKey) => {
    switch (columnKey) {
      case "postingDate":
      case "dueDate":
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
      case "orderStatus":
        return row.orderStatus ? (
          <Chip
            size="sm"
            variant="flat"
            color={statusColorMap[row.orderStatus] || "default"}
          >
            {row.orderStatus}
          </Chip>
        ) : (
          "-"
        );
      case "quantity":
      case "orderQuantity":
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
      case "orderDescription":
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
          "orderNo",
          "orderDescription",
          "locationCode",
          "assignedUserId",
          "createdBy",
        ]}
        emptyContent="ไม่พบข้อมูลการผลิต"
        statusField="entryType"
        statusOptions={[
          { uid: "Consumption", name: "Consumption" },
          { uid: "Output", name: "Output" },
          { uid: "Positive Adjmt.", name: "Positive Adjmt." },
          { uid: "Negative Adjmt.", name: "Negative Adjmt." },
          { uid: "Transfer", name: "Transfer" },
        ]}
      />
    </div>
  );
}
