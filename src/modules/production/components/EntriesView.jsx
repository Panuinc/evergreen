"use client";

import { useCallback, useMemo } from "react";
import { Chip, Tabs, Tab } from "@heroui/react";
import DataTable from "@/components/ui/DataTable";


const columns = [
  { name: "Entry No", uid: "bcItemLedgerEntryEntryNo", sortable: true },
  { name: "วันที่ลงบัญชี", uid: "bcItemLedgerEntryPostingDate", sortable: true },
  { name: "วันที่เอกสาร", uid: "bcItemLedgerEntryDocumentDate", sortable: true },
  { name: "ประเภท", uid: "bcItemLedgerEntryEntryType", sortable: true },
  { name: "ประเภทเอกสาร", uid: "bcItemLedgerEntryDocumentType" },
  { name: "เลขที่เอกสาร", uid: "bcItemLedgerEntryDocumentNo", sortable: true },
  { name: "รหัสสินค้า", uid: "bcItemLedgerEntryItemNo", sortable: true },
  { name: "รายละเอียด", uid: "bcItemLedgerEntryItemDescription", sortable: true },
  { name: "รายละเอียด 2", uid: "bcItemLedgerEntryDescription2" },
  { name: "พนักงาน", uid: "bcItemLedgerEntryEmployeeCode" },
  { name: "ชื่อพนักงาน", uid: "bcItemLedgerEntryEmployeeName" },
  { name: "คลัง", uid: "bcItemLedgerEntryLocationCode", sortable: true },
  { name: "Lot No", uid: "bcItemLedgerEntryLotNo" },
  { name: "Serial No", uid: "bcItemLedgerEntrySerialNo" },
  { name: "วันหมดอายุ", uid: "bcItemLedgerEntryExpirationDate", sortable: true },
  { name: "จำนวน", uid: "bcItemLedgerEntryQuantity", sortable: true },
  { name: "หน่วย", uid: "bcItemLedgerEntryUnitOfMeasureCode" },
  { name: "คงเหลือ", uid: "bcItemLedgerEntryRemainingQuantity", sortable: true },
  { name: "จำนวนออกใบแจ้งหนี้", uid: "bcItemLedgerEntryInvoicedQuantity", sortable: true },
  { name: "ออกใบแจ้งหนี้ครบ", uid: "bcItemLedgerEntryCompletelyInvoiced" },
  { name: "ต้นทุนต่อหน่วย (คาด)", uid: "bcItemLedgerEntryUnitCostExpected", sortable: true },
  { name: "ต้นทุนรวม (คาด)", uid: "bcItemLedgerEntryCostAmountExpected", sortable: true },
  { name: "ต้นทุนต่อหน่วย (จริง)", uid: "bcItemLedgerEntryUnitCostActual", sortable: true },
  { name: "ต้นทุนจริง", uid: "bcItemLedgerEntryCostAmountActual", sortable: true },
  { name: "ยอดขาย (คาด)", uid: "bcItemLedgerEntrySalesAmountExpected", sortable: true },
  { name: "ยอดขาย (จริง)", uid: "bcItemLedgerEntrySalesAmountActual", sortable: true },
  { name: "Open", uid: "bcItemLedgerEntryOpen" },
  { name: "รหัสแผนก", uid: "bcItemLedgerEntryGlobalDimension1Code", sortable: true },
  { name: "ชื่อแผนก", uid: "bcItemLedgerEntryGlobalDimension1Name", sortable: true },
  { name: "รหัสโครงการ", uid: "bcItemLedgerEntryGlobalDimension2Code", sortable: true },
  { name: "ชื่อโครงการ", uid: "bcItemLedgerEntryGlobalDimension2Name", sortable: true },
  { name: "Order Type", uid: "bcItemLedgerEntryOrderType" },
  { name: "Order Line No", uid: "bcItemLedgerEntryOrderLineNo" },
  { name: "Document Line No", uid: "bcItemLedgerEntryDocumentLineNo" },
  { name: "Variant Code", uid: "bcItemLedgerEntryVariantCode" },
  { name: "Bin", uid: "bcItemLedgerEntryBinCode" },
  { name: "หน่วยพื้นฐาน", uid: "bcItemLedgerEntryBaseUnitOfMeasure" },
  { name: "น้ำหนักรวม (Gross)", uid: "bcItemLedgerEntryTotalGrossWeight", sortable: true },
  { name: "น้ำหนักรวม (Net)", uid: "bcItemLedgerEntryTotalNetWeight", sortable: true },
  { name: "ผู้สร้าง", uid: "bcItemLedgerEntryCreatedBy" },
  { name: "Synced At", uid: "bcItemLedgerEntrySyncedAt", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "bcItemLedgerEntryEntryNo",
  "bcItemLedgerEntryPostingDate",
  "bcItemLedgerEntryDocumentDate",
  "bcItemLedgerEntryEntryType",
  "bcItemLedgerEntryDocumentType",
  "bcItemLedgerEntryDocumentNo",
  "bcItemLedgerEntryItemNo",
  "bcItemLedgerEntryItemDescription",
  "bcItemLedgerEntryDescription2",
  "bcItemLedgerEntryEmployeeCode",
  "bcItemLedgerEntryEmployeeName",
  "bcItemLedgerEntryLocationCode",
  "bcItemLedgerEntryLotNo",
  "bcItemLedgerEntrySerialNo",
  "bcItemLedgerEntryExpirationDate",
  "bcItemLedgerEntryQuantity",
  "bcItemLedgerEntryUnitOfMeasureCode",
  "bcItemLedgerEntryRemainingQuantity",
  "bcItemLedgerEntryInvoicedQuantity",
  "bcItemLedgerEntryCompletelyInvoiced",
  "bcItemLedgerEntryUnitCostExpected",
  "bcItemLedgerEntryCostAmountExpected",
  "bcItemLedgerEntryUnitCostActual",
  "bcItemLedgerEntryCostAmountActual",
  "bcItemLedgerEntrySalesAmountExpected",
  "bcItemLedgerEntrySalesAmountActual",
  "bcItemLedgerEntryOpen",
  "bcItemLedgerEntryGlobalDimension1Code",
  "bcItemLedgerEntryGlobalDimension1Name",
  "bcItemLedgerEntryGlobalDimension2Code",
  "bcItemLedgerEntryGlobalDimension2Name",
  "bcItemLedgerEntryOrderType",
  "bcItemLedgerEntryOrderLineNo",
  "bcItemLedgerEntryDocumentLineNo",
  "bcItemLedgerEntryVariantCode",
  "bcItemLedgerEntryBinCode",
  "bcItemLedgerEntryBaseUnitOfMeasure",
  "bcItemLedgerEntryTotalGrossWeight",
  "bcItemLedgerEntryTotalNetWeight",
  "bcItemLedgerEntryCreatedBy",
  "bcItemLedgerEntrySyncedAt",
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
  "bcItemLedgerEntryEmployeeCode",
  "bcItemLedgerEntryEmployeeName",
  "bcItemLedgerEntryCreatedBy",
];

const statusOptions = [
  { uid: "Consumption", name: "Consumption" },
  { uid: "Output", name: "Output" },
];


export default function EntriesView({ data, loading }) {
  const wpcData = useMemo(
    () => data.filter((r) => r.bcItemLedgerEntryGlobalDimension1Code === "WPC"),
    [data],
  );
  const otherData = useMemo(
    () => data.filter((r) => r.bcItemLedgerEntryGlobalDimension1Code !== "WPC"),
    [data],
  );

  const renderCell = useCallback((row, columnKey) => {
    switch (columnKey) {
      case "bcItemLedgerEntryPostingDate":
      case "bcItemLedgerEntryDocumentDate":
      case "bcItemLedgerEntryExpirationDate":
        return row[columnKey]
          ? new Date(row[columnKey]).toLocaleDateString("th-TH")
          : "-";
      case "bcItemLedgerEntrySyncedAt":
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
      case "bcItemLedgerEntryQuantity":
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
      case "bcItemLedgerEntryOpen":
        return row[columnKey] ? "Yes" : "No";
      case "bcItemLedgerEntryItemDescription":
      case "bcItemLedgerEntryDescription2":
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
            initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
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
            initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
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
