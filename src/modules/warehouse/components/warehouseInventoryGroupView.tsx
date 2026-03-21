"use client";

import { useCallback, useMemo, useState } from "react";
import { Chip, Card, CardBody, Button } from "@heroui/react";
import { Printer } from "lucide-react";
import DataTable from "@/components/ui/dataTable";
import PrintRfidModal from "@/modules/warehouse/components/printRfidModal";
import type { BcItem, WarehouseInventoryGroupViewProps } from "@/modules/warehouse/types";

const columns = [
  { name: "รหัสสินค้า", uid: "bcItemNo", sortable: true },
  { name: "ชื่อสินค้า", uid: "bcItemDescription", sortable: true },
  { name: "โครงการ", uid: "projectName", sortable: true },
  { name: "ประเภท", uid: "bcItemType", sortable: true },
  { name: "คงเหลือ", uid: "bcItemInventory", sortable: true },
  { name: "หน่วย", uid: "bcItemBaseUnitOfMeasure", sortable: true },
  { name: "ราคาต่อหน่วย", uid: "bcItemUnitPrice", sortable: true },
  { name: "ต้นทุน", uid: "bcItemUnitCost", sortable: true },
  { name: "หมวดหมู่", uid: "bcItemItemCategoryCode", sortable: true },
  { name: "", uid: "actions" },
];

const initialVisibleColumns = [
  "bcItemNo",
  "bcItemDescription",
  "projectName",
  "bcItemType",
  "bcItemInventory",
  "bcItemBaseUnitOfMeasure",
  "bcItemUnitPrice",
  "bcItemUnitCost",
  "bcItemItemCategoryCode",
  "actions",
];

export default function WarehouseInventoryGroupView({ items, loading }: WarehouseInventoryGroupViewProps) {
  const [printItem, setPrintItem] = useState<BcItem | null>(null);

  const summary = useMemo(() => {
    const totalQty = items.reduce((s, i) => s + (Number(i.bcItemInventory) || 0), 0);
    const totalValue = items.reduce(
      (s, i) => s + (Number(i.bcItemInventory) || 0) * (Number(i.bcItemUnitCost) || 0),
      0,
    );
    return { totalItems: items.length, totalQty, totalValue };
  }, [items]);

  const renderCell = useCallback((item: BcItem, columnKey: string) => {
    switch (columnKey) {
      case "bcItemDescription":
        return <span className="font-light">{item.bcItemDescription}</span>;
      case "projectName":
        return item.projectName ? (
          <Chip variant="flat" size="md" radius="md" color="secondary">
            {item.projectName}
          </Chip>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      case "bcItemInventory": {
        const inv = Number(item.bcItemInventory);
        return (
          <span className={inv > 0 ? "text-success" : "text-danger"}>
            {item.bcItemInventory != null ? inv.toLocaleString("th-TH") : "-"}
          </span>
        );
      }
      case "bcItemUnitPrice":
        return item.bcItemUnitPrice != null
          ? Number(item.bcItemUnitPrice).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      case "bcItemUnitCost": {
        const hasCost = item.bcItemUnitCost != null && Number(item.bcItemUnitCost) > 0;
        return (
          <span className={hasCost ? "text-primary" : "text-danger"}>
            {item.bcItemUnitCost != null
              ? Number(item.bcItemUnitCost).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })
              : "-"}
          </span>
        );
      }
      case "bcItemType":
        return (
          <Chip variant="flat" size="md" radius="md" color="default">
            {item.bcItemType || "-"}
          </Chip>
        );
      case "actions":
        return (
          <Button
            isIconOnly
            size="md"
            radius="md"
            variant="flat"
            onPress={() => setPrintItem(item)}
          >
            <Printer />
          </Button>
        );
      default:
        return (item as unknown as Record<string, unknown>)[columnKey]?.toString() || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="gap-1">
            <p className="text-xs text-muted-foreground">รายการสินค้า</p>
            <p className="text-xs font-light">
              {summary.totalItems.toLocaleString("th-TH")}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="gap-1">
            <p className="text-xs text-muted-foreground">จำนวนคงเหลือ</p>
            <p className="text-xs font-light text-success">
              {summary.totalQty.toLocaleString("th-TH")}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="gap-1">
            <p className="text-xs text-muted-foreground">มูลค่า (ต้นทุน)</p>
            <p className="text-xs font-light text-primary">
              {summary.totalValue.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </p>
          </CardBody>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={items}
        renderCell={renderCell}
        enableCardView
        rowKey="bcItemNo"
        isLoading={loading}
        initialVisibleColumns={initialVisibleColumns}
        searchPlaceholder="ค้นหาด้วยรหัสหรือชื่อสินค้า..."
        searchKeys={["bcItemNo", "bcItemDescription", "projectName"]}
        emptyContent="ไม่พบรายการสินค้า"
        actionMenuItems={(item: BcItem) => [
          { key: "print", label: "พิมพ์", icon: <Printer />, onPress: () => setPrintItem(item) },
        ]}
      />

      <PrintRfidModal
        isOpen={!!printItem}
        onClose={() => setPrintItem(null)}
        item={printItem}
      />
    </div>
  );
}
