"use client";

import { useCallback, useMemo } from "react";
import { Chip, Tabs, Tab } from "@heroui/react";
import DataTable from "@/components/ui/dataTable";
import type { EntriesViewProps } from "@/modules/production/types";


const columns = [
  { name: "Entry No", uid: "bcItemLedgerEntryEntryNo", sortable: true },
  { name: "วันที่ลงบัญชี", uid: "bcItemLedgerEntryPostingDate", sortable: true },
  { name: "วันที่เอกสาร", uid: "bcItemLedgerEntryDocumentDate", sortable: true },
  { name: "ประเภท", uid: "bcItemLedgerEntryEntryType", sortable: true },
  { name: "ประเภทเอกสาร", uid: "bcItemLedgerEntryDocumentType" },
  { name: "เลขที่เอกสาร", uid: "bcItemLedgerEntryDocumentNo", sortable: true },
  { name: "รหัสสินค้า", uid: "bcItemLedgerEntryItemNo", sortable: true },
  { name: "รายละเอียด", uid: "bcItemLedgerEntryItemDescription", sortable: true },
  { name: "คลัง", uid: "bcItemLedgerEntryLocationCode", sortable: true },
  { name: "Lot No", uid: "bcItemLedgerEntryLotNo" },
  { name: "Serial No", uid: "bcItemLedgerEntrySerialNo" },
  { name: "วันหมดอายุ", uid: "bcItemLedgerEntryExpirationDate", sortable: true },
  { name: "จำนวน", uid: "bcItemLedgerEntryQuantityValue", sortable: true },
  { name: "หน่วย", uid: "bcItemLedgerEntryUnitOfMeasureCode" },
  { name: "คงเหลือ", uid: "bcItemLedgerEntryRemainingQuantity", sortable: true },
  { name: "จำนวนออกใบแจ้งหนี้", uid: "bcItemLedgerEntryInvoicedQuantity", sortable: true },
  { name: "ออกใบแจ้งหนี้ครบ", uid: "bcItemLedgerEntryCompletelyInvoiced" },
  { name: "Open", uid: "bcItemLedgerEntryOpenValue" },
  { name: "รหัสแผนก", uid: "bcItemLedgerEntryGlobalDimension1Code", sortable: true },
  { name: "รหัสโครงการ", uid: "bcItemLedgerEntryGlobalDimension2Code", sortable: true },
  { name: "Order Type", uid: "bcItemLedgerEntryOrderType" },
  { name: "Order Line No", uid: "bcItemLedgerEntryOrderLineNo" },
  { name: "Document Line No", uid: "bcItemLedgerEntryDocumentLineNo" },
  { name: "Variant Code", uid: "bcItemLedgerEntryVariantCode" },
  { name: "Synced At", uid: "bcSyncedAt", sortable: true },
];

const initialVisibleColumns = [
  "bcItemLedgerEntryEntryNo",
  "bcItemLedgerEntryPostingDate",
  "bcItemLedgerEntryDocumentDate",
  "bcItemLedgerEntryEntryType",
  "bcItemLedgerEntryDocumentType",
  "bcItemLedgerEntryDocumentNo",
  "bcItemLedgerEntryItemNo",
  "bcItemLedgerEntryItemDescription",
  "bcItemLedgerEntryLocationCode",
  "bcItemLedgerEntryLotNo",
  "bcItemLedgerEntrySerialNo",
  "bcItemLedgerEntryExpirationDate",
  "bcItemLedgerEntryQuantityValue",
  "bcItemLedgerEntryUnitOfMeasureCode",
  "bcItemLedgerEntryRemainingQuantity",
  "bcItemLedgerEntryInvoicedQuantity",
  "bcItemLedgerEntryCompletelyInvoiced",
  "bcItemLedgerEntryOpenValue",
  "bcItemLedgerEntryGlobalDimension1Code",
  "bcItemLedgerEntryGlobalDimension2Code",
  "bcItemLedgerEntryOrderType",
  "bcItemLedgerEntryOrderLineNo",
  "bcItemLedgerEntryDocumentLineNo",
  "bcItemLedgerEntryVariantCode",
  "bcSyncedAt",
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

const searchKeys = [
  "bcItemLedgerEntryEntryNo",
  "bcItemLedgerEntryDocumentNo",
  "bcItemLedgerEntryItemNo",
  "bcItemLedgerEntryItemDescription",
  "bcItemLedgerEntryLocationCode",
  "_removedEmployeeCode",
  "_removedEmployeeName",
  "bcItemLedgerEntryCreatedBy",
];

const statusOptions = [
  { uid: "Consumption", name: "Consumption" },
  { uid: "Output", name: "Output" },
];


export default function EntriesView({ data, loading }: EntriesViewProps) {
  const wpcData = useMemo(
    () => (data || []).filter((r) => r.bcItemLedgerEntryGlobalDimension1Code === "WPC"),
    [data],
  );
  const otherData = useMemo(
    () => (data || []).filter((r) => r.bcItemLedgerEntryGlobalDimension1Code !== "WPC"),
    [data],
  );

  const renderCell = useCallback((row, columnKey) => {
    switch (columnKey) {
      case "bcItemLedgerEntryPostingDate":
      case "bcItemLedgerEntryDocumentDate":
      case "bcItemLedgerEntryExpirationDate":
        return row[columnKey]
          ? new Date(row[columnKey]).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })
          : "-";
      case "bcSyncedAt":
        return row[columnKey]
          ? new Date(row[columnKey]).toLocaleString("th-TH", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "-";
      case "bcItemLedgerEntryEntryType":
        return row.bcItemLedgerEntryEntryType ? (
          <Chip
            size="md"
            variant="flat"
            color={entryTypeColorMap[row.bcItemLedgerEntryEntryType] || "default"}
          >
            {row.bcItemLedgerEntryEntryType}
          </Chip>
        ) : (
          "-"
        );
      case "bcItemLedgerEntryQuantityValue":
      case "bcItemLedgerEntryRemainingQuantity":
      case "bcItemLedgerEntryInvoicedQuantity":
      case "bcItemLedgerEntryOrderLineNo":
      case "bcItemLedgerEntryDocumentLineNo":
        return row[columnKey] != null
          ? Number(row[columnKey]).toLocaleString("th-TH")
          : "-";
      case "bcItemLedgerEntryUnitCostExpected":
      case "bcItemLedgerEntryCostAmountExpected":
      case "bcItemLedgerEntryUnitCostActual":
      case "bcItemLedgerEntryCostAmountActual":
      case "bcItemLedgerEntrySalesAmountExpected":
      case "bcItemLedgerEntrySalesAmountActual":
      case "bcItemLedgerEntryTotalGrossWeight":
      case "bcItemLedgerEntryTotalNetWeight":
        return row[columnKey] != null
          ? Number(row[columnKey]).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      case "bcItemLedgerEntryCompletelyInvoiced":
      case "bcItemLedgerEntryOpenValue":
        return row[columnKey] === true || row[columnKey] === "true" ? "Yes" : "No";
      case "bcItemLedgerEntryItemDescription":
      case "_removedDescription2":
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
      <Tabs aria-label="คลัง" variant="underlined">
        <Tab
          key="wpc"
          title={`WPC (${wpcData.length.toLocaleString("th-TH")})`}
        >
          <DataTable
            columns={columns}
            data={wpcData}
            renderCell={renderCell}
            rowKey="bcItemLedgerEntryId"
            isLoading={loading}
            initialVisibleColumns={initialVisibleColumns}
            searchPlaceholder="ค้นหาด้วย Entry No, เลขที่เอกสาร, รหัสสินค้า, รายละเอียด..."
            searchKeys={searchKeys}
            emptyContent="ไม่พบข้อมูลรายการเคลื่อนไหว WPC"
            statusField="bcItemLedgerEntryEntryType"
            statusOptions={statusOptions}
            enableCardView
          />
        </Tab>
        <Tab
          key="other"
          title={`อื่นๆ (${otherData.length.toLocaleString("th-TH")})`}
        >
          <DataTable
            columns={columns}
            data={otherData}
            renderCell={renderCell}
            rowKey="bcItemLedgerEntryId"
            isLoading={loading}
            initialVisibleColumns={initialVisibleColumns}
            searchPlaceholder="ค้นหาด้วย Entry No, เลขที่เอกสาร, รหัสสินค้า, รายละเอียด..."
            searchKeys={searchKeys}
            emptyContent="ไม่พบข้อมูลรายการเคลื่อนไหว"
            statusField="bcItemLedgerEntryEntryType"
            statusOptions={statusOptions}
            enableCardView
          />
        </Tab>
      </Tabs>
    </div>
  );
}
