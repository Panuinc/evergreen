"use client";

import { useCallback, useMemo } from "react";
import { Chip, Tabs, Tab } from "@heroui/react";
import DataTable from "@/components/ui/DataTable";


function fmtCurrency(v) {
  return `฿${Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}


const columns = [
  { name: "เลขที่ใบสั่งผลิต", uid: "bcProductionOrderExternalId", sortable: true },
  { name: "สถานะ", uid: "bcProductionOrderStatus", sortable: true },
  { name: "รายละเอียด", uid: "bcProductionOrderDescription", sortable: true },
  { name: "รายละเอียด 2", uid: "bcProductionOrderDescription2" },
  { name: "สินค้าที่ผลิต", uid: "bcProductionOrderSourceNo", sortable: true },
  { name: "Routing", uid: "bcProductionOrderRoutingNo", sortable: true },
  { name: "จำนวน", uid: "bcProductionOrderQuantity", sortable: true },
  { name: "ผลิตได้", uid: "outputQty", sortable: true },
  { name: "ต้นทุนผลิต", uid: "consumptionCost", sortable: true },
  { name: "ราคาขาย/ชิ้น", uid: "unitPrice", sortable: true },
  { name: "รายได้", uid: "revenue", sortable: true },
  { name: "กำไร/ขาดทุน", uid: "profit", sortable: true },
  { name: "Margin", uid: "profitMargin", sortable: true },
  { name: "รหัสแผนก", uid: "bcProductionOrderDimension1Code", sortable: true },
  { name: "ชื่อแผนก", uid: "bcProductionOrderDimension1Name", sortable: true },
  { name: "รหัสโครงการ", uid: "bcProductionOrderDimension2Code", sortable: true },
  { name: "ชื่อโครงการ", uid: "bcProductionOrderDimension2Name", sortable: true },
  { name: "คลัง", uid: "bcProductionOrderLocationCode", sortable: true },
  { name: "วันเริ่ม", uid: "bcProductionOrderStartingDateTime", sortable: true },
  { name: "วันสิ้นสุด", uid: "bcProductionOrderEndingDateTime", sortable: true },
  { name: "กำหนดส่ง", uid: "bcProductionOrderDueDate", sortable: true },
  { name: "Consumption คงเหลือ", uid: "bcProductionOrderRemainingConsumption", sortable: true },
  { name: "ผู้รับผิดชอบ", uid: "bcProductionOrderAssignedUserId", sortable: true },
  { name: "วันที่เสร็จ", uid: "bcProductionOrderFinishedDate", sortable: true },
  { name: "ระยะเวลา (วัน)", uid: "durationDays", sortable: true },
  { name: "Search Description", uid: "bcProductionOrderSearchDescription" },
  { name: "Synced At", uid: "bcProductionOrderSyncedAt", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "bcProductionOrderExternalId",
  "bcProductionOrderStatus",
  "bcProductionOrderDescription",
  "bcProductionOrderSourceNo",
  "bcProductionOrderQuantity",
  "outputQty",
  "consumptionCost",
  "unitPrice",
  "revenue",
  "profit",
  "profitMargin",
  "bcProductionOrderDimension1Name",
  "bcProductionOrderDimension2Name",
  "bcProductionOrderDueDate",
  "bcProductionOrderFinishedDate",
  "durationDays",
];

const statusColorMap = {
  Released: "primary",
  Finished: "success",
  Planned: "default",
  "Firm Planned": "warning",
};

const searchKeys = [
  "bcProductionOrderExternalId",
  "bcProductionOrderDescription",
  "bcProductionOrderSourceNo",
  "bcProductionOrderRoutingNo",
  "bcProductionOrderDimension1Code",
  "bcProductionOrderDimension2Code",
  "bcProductionOrderLocationCode",
  "bcProductionOrderAssignedUserId",
];

const statusOptions = [
  { uid: "Released", name: "Released" },
  { uid: "Finished", name: "Finished" },
  { uid: "Planned", name: "Planned" },
  { uid: "Firm Planned", name: "Firm Planned" },
];


export default function OrdersView({ data, loading }) {
  const enrichedData = useMemo(
    () =>
      data.map((r) => {
        let durationDays = null;
        if (r.bcProductionOrderStartingDateTime && r.bcProductionOrderFinishedDate) {
          const start = new Date(r.bcProductionOrderStartingDateTime);
          const end = new Date(r.bcProductionOrderFinishedDate);
          durationDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
        }
        return { ...r, durationDays };
      }),
    [data],
  );

  const wpcData = useMemo(
    () => enrichedData.filter((r) => r.bcProductionOrderDimension1Code === "WPC"),
    [enrichedData],
  );
  const otherData = useMemo(
    () => enrichedData.filter((r) => r.bcProductionOrderDimension1Code !== "WPC"),
    [enrichedData],
  );

  const getRowClassName = useCallback((row) => {
    if (!row.revenue || row.revenue <= 0) return "";
    if (row.profit >= 0) return "bg-success-50/50";
    return "bg-danger-50/50";
  }, []);

  const renderCell = useCallback((row, columnKey) => {
    switch (columnKey) {
      case "bcProductionOrderStatus":
        return row.bcProductionOrderStatus ? (
          <Chip
            size="md"
            variant="flat"
            color={statusColorMap[row.bcProductionOrderStatus] || "default"}
          >
            {row.bcProductionOrderStatus}
          </Chip>
        ) : (
          "-"
        );
      case "bcProductionOrderStartingDateTime":
      case "bcProductionOrderEndingDateTime":
      case "bcProductionOrderSyncedAt":
        return row[columnKey]
          ? new Date(row[columnKey]).toLocaleString("th-TH", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "-";
      case "bcProductionOrderDueDate":
      case "bcProductionOrderFinishedDate":
        return row[columnKey]
          ? new Date(row[columnKey]).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })
          : "-";
      case "durationDays":
        return row.durationDays != null
          ? `${row.durationDays} วัน`
          : "-";
      case "bcProductionOrderQuantity":
      case "outputQty":
      case "bcProductionOrderRemainingConsumption":
        return row[columnKey] != null
          ? Number(row[columnKey]).toLocaleString("th-TH")
          : "-";
      case "consumptionCost":
      case "unitPrice":
      case "revenue":
        return row[columnKey] ? fmtCurrency(row[columnKey]) : "-";
      case "profit":
        return row[columnKey] != null && row.revenue > 0 ? (
          <span
            className={`font-light ${row[columnKey] >= 0 ? "text-success" : "text-danger"}`}
          >
            {fmtCurrency(row[columnKey])}
          </span>
        ) : (
          "-"
        );
      case "profitMargin":
        if (row.profitMargin == null) return "-";
        return (
          <Chip
            size="md"
            variant="flat"
            color={
              row.profitMargin >= 20
                ? "success"
                : row.profitMargin >= 0
                  ? "warning"
                  : "danger"
            }
          >
            {row.profitMargin}%
          </Chip>
        );
      case "bcProductionOrderDescription":
      case "bcProductionOrderDescription2":
      case "bcProductionOrderSearchDescription":
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
            rowKey="bcProductionOrderId"
            isLoading={loading}
            initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
            searchPlaceholder="ค้นหาด้วยเลขที่ใบสั่งผลิต, รายละเอียด, สินค้า..."
            searchKeys={searchKeys}
            emptyContent="ไม่พบข้อมูลใบสั่งผลิต WPC"
            statusField="bcProductionOrderStatus"
            statusOptions={statusOptions}
            getRowClassName={getRowClassName}
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
            rowKey="bcProductionOrderId"
            isLoading={loading}
            initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
            searchPlaceholder="ค้นหาด้วยเลขที่ใบสั่งผลิต, รายละเอียด, สินค้า..."
            searchKeys={searchKeys}
            emptyContent="ไม่พบข้อมูลใบสั่งผลิต"
            statusField="bcProductionOrderStatus"
            statusOptions={statusOptions}
            getRowClassName={getRowClassName}
            enableCardView
          />
        </Tab>
      </Tabs>
    </div>
  );
}
