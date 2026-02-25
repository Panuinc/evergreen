"use client";

import { useCallback } from "react";
import { Chip } from "@heroui/react";
import { useProductionOrders } from "@/hooks/production/useProductionOrders";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่ใบสั่งผลิต", uid: "id", sortable: true },
  { name: "สถานะ", uid: "status", sortable: true },
  { name: "รายละเอียด", uid: "description", sortable: true },
  { name: "รายละเอียด 2", uid: "description2" },
  { name: "สินค้าที่ผลิต", uid: "sourceNo", sortable: true },
  { name: "Routing", uid: "routingNo", sortable: true },
  { name: "จำนวน", uid: "quantity", sortable: true },
  { name: "แผนก", uid: "dimension1Code", sortable: true },
  { name: "โครงการ", uid: "dimension2Code", sortable: true },
  { name: "คลัง", uid: "locationCode", sortable: true },
  { name: "วันเริ่ม", uid: "startingDateTime", sortable: true },
  { name: "วันสิ้นสุด", uid: "endingDateTime", sortable: true },
  { name: "กำหนดส่ง", uid: "dueDate", sortable: true },
  { name: "Consumption คงเหลือ", uid: "remainingConsumption", sortable: true },
  { name: "ผู้รับผิดชอบ", uid: "assignedUserId", sortable: true },
  { name: "วันที่เสร็จ", uid: "finishedDate", sortable: true },
  { name: "Search Description", uid: "searchDescription" },
  { name: "Synced At", uid: "syncedAt", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "id",
  "status",
  "description",
  "sourceNo",
  "quantity",
  "dimension1Code",
  "dimension2Code",
  "locationCode",
  "dueDate",
  "assignedUserId",
];

const statusColorMap = {
  Released: "primary",
  Finished: "success",
  Planned: "default",
  "Firm Planned": "warning",
};

export default function ProductionOrdersPage() {
  const { data, loading } = useProductionOrders();

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
      case "quantity":
      case "remainingConsumption":
        return row[columnKey] != null
          ? Number(row[columnKey]).toLocaleString("th-TH")
          : "-";
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
      <DataTable
        columns={columns}
        data={data}
        renderCell={renderCell}
        rowKey="id"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยเลขที่ใบสั่งผลิต, รายละเอียด, สินค้า..."
        searchKeys={[
          "id",
          "description",
          "sourceNo",
          "routingNo",
          "dimension1Code",
          "dimension2Code",
          "locationCode",
          "assignedUserId",
        ]}
        emptyContent="ไม่พบข้อมูลใบสั่งผลิต"
        statusField="status"
        statusOptions={[
          { uid: "Released", name: "Released" },
          { uid: "Finished", name: "Finished" },
          { uid: "Planned", name: "Planned" },
          { uid: "Firm Planned", name: "Firm Planned" },
        ]}
      />
    </div>
  );
}
