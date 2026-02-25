"use client";

import { useCallback, useMemo } from "react";
import { Chip, Tabs, Tab } from "@heroui/react";
import { useProductionOrders } from "@/hooks/production/useProductionOrders";
import DataTable from "@/components/ui/DataTable";

function fmtCurrency(v) {
  return `฿${Number(v || 0).toLocaleString("th-TH", { minimumFractionDigits: 2 })}`;
}

const columns = [
  { name: "เลขที่ใบสั่งผลิต", uid: "id", sortable: true },
  { name: "สถานะ", uid: "status", sortable: true },
  { name: "รายละเอียด", uid: "description", sortable: true },
  { name: "รายละเอียด 2", uid: "description2" },
  { name: "สินค้าที่ผลิต", uid: "sourceNo", sortable: true },
  { name: "Routing", uid: "routingNo", sortable: true },
  { name: "จำนวน", uid: "quantity", sortable: true },
  { name: "ผลิตได้", uid: "outputQty", sortable: true },
  { name: "ต้นทุนผลิต", uid: "consumptionCost", sortable: true },
  { name: "ราคาขาย/ชิ้น", uid: "unitPrice", sortable: true },
  { name: "รายได้", uid: "revenue", sortable: true },
  { name: "กำไร/ขาดทุน", uid: "profit", sortable: true },
  { name: "Margin", uid: "profitMargin", sortable: true },
  { name: "รหัสแผนก", uid: "dimension1Code", sortable: true },
  { name: "ชื่อแผนก", uid: "dimension1Name", sortable: true },
  { name: "รหัสโครงการ", uid: "dimension2Code", sortable: true },
  { name: "ชื่อโครงการ", uid: "dimension2Name", sortable: true },
  { name: "คลัง", uid: "locationCode", sortable: true },
  { name: "วันเริ่ม", uid: "startingDateTime", sortable: true },
  { name: "วันสิ้นสุด", uid: "endingDateTime", sortable: true },
  { name: "กำหนดส่ง", uid: "dueDate", sortable: true },
  { name: "Consumption คงเหลือ", uid: "remainingConsumption", sortable: true },
  { name: "ผู้รับผิดชอบ", uid: "assignedUserId", sortable: true },
  { name: "วันที่เสร็จ", uid: "finishedDate", sortable: true },
  { name: "ระยะเวลา (วัน)", uid: "durationDays", sortable: true },
  { name: "Search Description", uid: "searchDescription" },
  { name: "Synced At", uid: "syncedAt", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "id",
  "status",
  "description",
  "sourceNo",
  "quantity",
  "outputQty",
  "consumptionCost",
  "unitPrice",
  "revenue",
  "profit",
  "profitMargin",
  "dimension1Name",
  "dimension2Name",
  "dueDate",
  "finishedDate",
  "durationDays",
];

const statusColorMap = {
  Released: "primary",
  Finished: "success",
  Planned: "default",
  "Firm Planned": "warning",
};

const searchKeys = [
  "id",
  "description",
  "sourceNo",
  "routingNo",
  "dimension1Code",
  "dimension2Code",
  "locationCode",
  "assignedUserId",
];

const statusOptions = [
  { uid: "Released", name: "Released" },
  { uid: "Finished", name: "Finished" },
  { uid: "Planned", name: "Planned" },
  { uid: "Firm Planned", name: "Firm Planned" },
];

export default function ProductionOrdersPage() {
  const { data, loading } = useProductionOrders();

  const enrichedData = useMemo(
    () =>
      data.map((r) => {
        let durationDays = null;
        if (r.startingDateTime && r.finishedDate) {
          const start = new Date(r.startingDateTime);
          const end = new Date(r.finishedDate);
          durationDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
        }
        return { ...r, durationDays };
      }),
    [data],
  );

  const wpcData = useMemo(
    () => enrichedData.filter((r) => r.dimension1Code === "WPC"),
    [enrichedData],
  );
  const otherData = useMemo(
    () => enrichedData.filter((r) => r.dimension1Code !== "WPC"),
    [enrichedData],
  );

  const getRowClassName = useCallback((row) => {
    if (!row.revenue || row.revenue <= 0) return "";
    if (row.profit >= 0) return "bg-success-50/50";
    return "bg-danger-50/50";
  }, []);

  const renderCell = useCallback((row, columnKey) => {
    switch (columnKey) {
      case "status":
        return row.status ? (
          <Chip
            size="sm"
            variant="flat"
            color={statusColorMap[row.status] || "default"}
          >
            {row.status}
          </Chip>
        ) : (
          "-"
        );
      case "startingDateTime":
      case "endingDateTime":
      case "syncedAt":
        return row[columnKey]
          ? new Date(row[columnKey]).toLocaleString("th-TH", {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "-";
      case "dueDate":
      case "finishedDate":
        return row[columnKey]
          ? new Date(row[columnKey]).toLocaleDateString("th-TH")
          : "-";
      case "durationDays":
        return row.durationDays != null
          ? `${row.durationDays} วัน`
          : "-";
      case "quantity":
      case "outputQty":
      case "remainingConsumption":
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
            className={`font-semibold ${row[columnKey] >= 0 ? "text-success" : "text-danger"}`}
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
            size="sm"
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
      case "description":
      case "description2":
      case "searchDescription":
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
            rowKey="id"
            isLoading={loading}
            initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
            searchPlaceholder="ค้นหาด้วยเลขที่ใบสั่งผลิต, รายละเอียด, สินค้า..."
            searchKeys={searchKeys}
            emptyContent="ไม่พบข้อมูลใบสั่งผลิต WPC"
            statusField="status"
            statusOptions={statusOptions}
            getRowClassName={getRowClassName}
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
            rowKey="id"
            isLoading={loading}
            initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
            searchPlaceholder="ค้นหาด้วยเลขที่ใบสั่งผลิต, รายละเอียด, สินค้า..."
            searchKeys={searchKeys}
            emptyContent="ไม่พบข้อมูลใบสั่งผลิต"
            statusField="status"
            statusOptions={statusOptions}
            getRowClassName={getRowClassName}
          />
        </Tab>
      </Tabs>
    </div>
  );
}
