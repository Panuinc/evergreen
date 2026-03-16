"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Tooltip,
} from "@heroui/react";
import DataTable from "@/components/ui/DataTable";
import Loading from "@/components/ui/Loading";
import { toast } from "sonner";

function fmt(v) {
  return Number(v || 0).toLocaleString("th-TH");
}

const STATUS_COLOR = {
  Finished: "success",
  Released: "primary",
  "Firm Planned": "warning",
  Planned: "warning",
};

const columns = [
  { name: "รหัสสินค้า", uid: "itemNo", sortable: true },
  { name: "รายละเอียด", uid: "description", sortable: true },
  { name: "ประเภท", uid: "category", sortable: true },
  { name: "สั่งซื้อ", uid: "soQty", sortable: true },
  { name: "ส่งแล้ว", uid: "shippedQty", sortable: true },
  { name: "ค้างส่ง", uid: "soOutstandingQty", sortable: true },
  { name: "สถานะตั๋วผลิต", uid: "poStatus", sortable: true },
  { name: "ตั๋วผลิต", uid: "poDetails", sortable: false },
  { name: "สั่งผลิตรวม", uid: "poTotalQty", sortable: true },
];

const initialColumns = [
  "itemNo",
  "description",
  "soQty",
  "shippedQty",
  "soOutstandingQty",
  "poStatus",
  "poDetails",
  "poTotalQty",
];

export default function FgCoverageView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/production/fgCoverage");
        if (!res.ok) throw new Error("Failed to fetch");
        setData(await res.json());
      } catch {
        toast.error("โหลดข้อมูลสถานะตั๋วผลิตล้มเหลว");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "itemNo":
        return <span className="font-mono text-xs">{item.itemNo}</span>;
      case "description":
        return (
          <span className="max-w-60 truncate block text-xs">
            {item.description || "-"}
          </span>
        );
      case "category":
        return (
          <Chip size="md" variant="flat" color="default">
            {item.category || "-"}
          </Chip>
        );
      case "soQty":
        return <span className="text-xs">{fmt(item.soQty)}</span>;
      case "shippedQty":
        return <span className="text-xs">{fmt(item.shippedQty)}</span>;
      case "soOutstandingQty":
        return (
          <span className="text-xs font-semibold text-warning">
            {fmt(item.soOutstandingQty)}
          </span>
        );
      case "poTotalQty":
        return item.poTotalQty > 0 ? (
          <span className="text-xs">{fmt(item.poTotalQty)}</span>
        ) : (
          <span className="text-xs text-default-400">-</span>
        );
      case "poStatus":
        return item.hasProductionOrder ? (
          <Chip
            size="md"
            variant="flat"
            color={
              item.poStatuses.includes("Finished")
                ? "success"
                : item.poStatuses.includes("Released")
                  ? "primary"
                  : "warning"
            }
          >
            ออกตั๋วแล้ว ({item.poCount})
          </Chip>
        ) : (
          <Chip size="md" variant="flat" color="danger">
            ยังไม่ออกตั๋ว
          </Chip>
        );
      case "poDetails":
        if (!item.productionOrders || item.productionOrders.length === 0) {
          return <span className="text-xs text-default-400">-</span>;
        }
        return (
          <div className="flex flex-col gap-1">
            {item.productionOrders.map((po) => (
              <Tooltip
                key={po.orderNo}
                content={`${po.orderNo} • ${po.status} • จำนวน ${fmt(po.quantity)}${po.dueDate ? ` • กำหนด ${po.dueDate}` : ""}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs">{po.orderNo}</span>
                  <Chip size="sm" variant="dot" color={STATUS_COLOR[po.status] || "default"}>
                    {fmt(po.quantity)}
                  </Chip>
                </div>
              </Tooltip>
            ))}
          </div>
        );
      default:
        return <span className="text-xs">{item[columnKey] || "-"}</span>;
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loading />
      </div>
    );
  }

  if (!data) return null;

  const fgCoverage = data.fgCoverage || [];
  const noPo = fgCoverage.filter((f) => !f.hasProductionOrder);
  const hasPo = fgCoverage.filter((f) => f.hasProductionOrder);

  return (
    <div className="flex flex-col w-full gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card shadow="none" className="border border-border">
          <CardBody className="gap-1">
            <p className="text-xs text-muted-foreground">FG ที่ค้างส่งทั้งหมด</p>
            <p className="text-xs font-light">{fgCoverage.length} รายการ</p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border">
          <CardBody className="gap-1">
            <p className="text-xs text-muted-foreground">ออกตั๋วผลิตแล้ว</p>
            <p className="text-xs font-light text-success">{hasPo.length} รายการ</p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border">
          <CardBody className="gap-1">
            <p className="text-xs text-muted-foreground">ยังไม่ออกตั๋ว</p>
            <p className="text-xs font-light text-danger">{noPo.length} รายการ</p>
          </CardBody>
        </Card>
      </div>

      <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-light">สถานะตั๋วผลิตราย FG (เฉพาะที่ยังค้างส่ง)</p>
            <Chip size="md" color="danger" variant="flat">
              ยังไม่ออกตั๋ว {noPo.length}
            </Chip>
            <Chip size="md" color="success" variant="flat">
              ออกแล้ว {hasPo.length}
            </Chip>
          </div>
        </CardHeader>
        <CardBody>
          <DataTable
            columns={columns}
            data={fgCoverage}
            renderCell={renderCell}
            rowKey="itemNo"
            searchKeys={["itemNo", "description", "category"]}
            searchPlaceholder="ค้นหาสินค้า..."
            initialVisibleColumns={initialColumns}
            defaultSortDescriptor={{ column: "soOutstandingQty", direction: "descending" }}
            defaultRowsPerPage={20}
          />
        </CardBody>
      </Card>
    </div>
  );
}
