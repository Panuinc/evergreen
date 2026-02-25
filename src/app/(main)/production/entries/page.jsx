"use client";

import { useCallback } from "react";
import { Chip } from "@heroui/react";
import { useProduction } from "@/hooks/production/useProduction";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "Entry No", uid: "entryNo", sortable: true },
  { name: "วันที่ลงบัญชี", uid: "postingDate", sortable: true },
  { name: "วันที่เอกสาร", uid: "documentDate", sortable: true },
  { name: "ประเภท", uid: "entryType", sortable: true },
  { name: "ประเภทเอกสาร", uid: "documentType" },
  { name: "เลขที่เอกสาร", uid: "documentNo", sortable: true },
  { name: "รหัสสินค้า", uid: "itemNo", sortable: true },
  { name: "รายละเอียด", uid: "itemDescription", sortable: true },
  { name: "รายละเอียด 2", uid: "description2" },
  { name: "พนักงาน", uid: "employeeCode" },
  { name: "ชื่อพนักงาน", uid: "employeeName" },
  { name: "คลัง", uid: "locationCode", sortable: true },
  { name: "Lot No", uid: "lotNo" },
  { name: "Serial No", uid: "serialNo" },
  { name: "วันหมดอายุ", uid: "expirationDate", sortable: true },
  { name: "จำนวน", uid: "quantity", sortable: true },
  { name: "หน่วย", uid: "unitOfMeasureCode" },
  { name: "คงเหลือ", uid: "remainingQuantity", sortable: true },
  { name: "จำนวนออกใบแจ้งหนี้", uid: "invoicedQuantity", sortable: true },
  { name: "ออกใบแจ้งหนี้ครบ", uid: "completelyInvoiced" },
  { name: "ต้นทุนต่อหน่วย (คาด)", uid: "unitCostExpected", sortable: true },
  { name: "ต้นทุนรวม (คาด)", uid: "costAmountExpected", sortable: true },
  { name: "ต้นทุนต่อหน่วย (จริง)", uid: "unitCostActual", sortable: true },
  { name: "ต้นทุนจริง", uid: "costAmountActual", sortable: true },
  { name: "ยอดขาย (คาด)", uid: "salesAmountExpected", sortable: true },
  { name: "ยอดขาย (จริง)", uid: "salesAmountActual", sortable: true },
  { name: "Open", uid: "open" },
  { name: "แผนก", uid: "globalDimension1Code", sortable: true },
  { name: "โครงการ", uid: "globalDimension2Code", sortable: true },
  { name: "Order Type", uid: "orderType" },
  { name: "Order Line No", uid: "orderLineNo" },
  { name: "Document Line No", uid: "documentLineNo" },
  { name: "Variant Code", uid: "variantCode" },
  { name: "Bin", uid: "binCode" },
  { name: "หน่วยพื้นฐาน", uid: "baseUnitOfMeasure" },
  { name: "น้ำหนักรวม (Gross)", uid: "totalGrossWeight", sortable: true },
  { name: "น้ำหนักรวม (Net)", uid: "totalNetWeight", sortable: true },
  { name: "ผู้สร้าง", uid: "createdBy" },
  { name: "Synced At", uid: "syncedAt", sortable: true },
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
      case "documentDate":
      case "expirationDate":
        return row[columnKey]
          ? new Date(row[columnKey]).toLocaleDateString("th-TH")
          : "-";
      case "syncedAt":
        return row[columnKey]
          ? new Date(row[columnKey]).toLocaleString("th-TH", {
              dateStyle: "short",
              timeStyle: "short",
            })
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
      case "invoicedQuantity":
      case "orderLineNo":
      case "documentLineNo":
        return row[columnKey] != null
          ? Number(row[columnKey]).toLocaleString("th-TH")
          : "-";
      case "unitCostExpected":
      case "costAmountExpected":
      case "unitCostActual":
      case "costAmountActual":
      case "salesAmountExpected":
      case "salesAmountActual":
      case "totalGrossWeight":
      case "totalNetWeight":
        return row[columnKey] != null
          ? Number(row[columnKey]).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      case "completelyInvoiced":
      case "open":
        return row[columnKey] ? "Yes" : "No";
      case "itemDescription":
      case "description2":
        return (
          <span className="max-w-75 truncate block">
            {row[columnKey] || "-"}
          </span>
        );
      default:
        return row[columnKey] != null ? String(row[columnKey]) : "-";
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
