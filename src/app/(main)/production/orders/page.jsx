"use client";

import { useCallback, useMemo } from "react";
import { Chip } from "@heroui/react";
import { useProductionOrders } from "@/hooks/production/useProductionOrders";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "เลขที่ใบสั่ง", uid: "orderNo", sortable: true },
  { name: "สถานะ", uid: "status", sortable: true },
  { name: "ต้นทุนวัตถุดิบ", uid: "consumptionCost", sortable: true },
  { name: "มูลค่าผลผลิต", uid: "outputCost", sortable: true },
  { name: "Yield %", uid: "yieldRate", sortable: true },
  { name: "เบิก (ครั้ง)", uid: "consumptionCount", sortable: true },
  { name: "ผลิต (ครั้ง)", uid: "outputCount", sortable: true },
  { name: "จำนวนเบิก", uid: "totalQty", sortable: true },
  { name: "จำนวนผลิต", uid: "outputQty", sortable: true },
  { name: "วัตถุดิบ", uid: "materialsCount", sortable: true },
  { name: "FG", uid: "outputsCount", sortable: true },
  { name: "คลัง", uid: "locations", sortable: true },
  { name: "สายการผลิต", uid: "dim1", sortable: true },
  { name: "โครงการ", uid: "dim2", sortable: true },
  { name: "วันที่เริ่ม", uid: "firstDate", sortable: true },
  { name: "วันที่ล่าสุด", uid: "lastDate", sortable: true },
  { name: "ผู้บันทึก", uid: "createdBy", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "orderNo",
  "status",
  "consumptionCost",
  "outputCost",
  "yieldRate",
  "consumptionCount",
  "outputCount",
  "materialsCount",
  "outputsCount",
  "dim1",
  "firstDate",
  "lastDate",
];

function fmt(v) {
  return `฿${Number(v).toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

export default function ProductionOrdersPage() {
  const { orders, loading } = useProductionOrders();

  const statusOptions = useMemo(() => [
    { uid: "เปิด", name: "เปิด" },
    { uid: "ปิด", name: "ปิด" },
  ], []);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "orderNo":
        return <span className="font-mono text-sm font-medium">{item.orderNo}</span>;
      case "status":
        return (
          <Chip
            variant="flat"
            size="sm"
            radius="md"
            color={item.status === "เปิด" ? "warning" : "success"}
          >
            {item.status}
          </Chip>
        );
      case "consumptionCost":
        return (
          <span className="text-danger font-medium">
            {fmt(item.consumptionCost)}
          </span>
        );
      case "outputCost":
        return (
          <span className="text-success font-medium">
            {fmt(item.outputCost)}
          </span>
        );
      case "yieldRate": {
        const rate = item.yieldRate;
        return (
          <Chip
            variant="flat"
            size="sm"
            radius="md"
            color={rate >= 80 ? "success" : rate >= 50 ? "warning" : "danger"}
          >
            {rate}%
          </Chip>
        );
      }
      case "consumptionCount":
      case "outputCount":
      case "materialsCount":
      case "outputsCount":
        return (
          <span className="text-center">
            {Number(item[columnKey]).toLocaleString("th-TH")}
          </span>
        );
      case "totalQty":
      case "outputQty":
        return (
          <span>
            {Number(item[columnKey]).toLocaleString("th-TH")}
          </span>
        );
      case "firstDate":
      case "lastDate":
        return item[columnKey]
          ? new Date(item[columnKey]).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "2-digit",
            })
          : "-";
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
      default:
        return item[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <DataTable
        columns={columns}
        data={orders}
        renderCell={renderCell}
        enableCardView
        rowKey="orderNo"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        statusField="status"
        statusOptions={statusOptions}
        filterLabel="สถานะ"
        searchPlaceholder="ค้นหาเลขที่ใบสั่ง, สายการผลิต, โครงการ, ผู้บันทึก..."
        searchKeys={["orderNo", "dim1", "dim2", "createdBy", "locations"]}
        emptyContent="ไม่พบใบสั่งผลิต"
      />
    </div>
  );
}
