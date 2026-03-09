"use client";

import { useCallback, useMemo, useState } from "react";
import { Chip, Card, CardBody, Button } from "@heroui/react";
import { Printer } from "lucide-react";
import DataTable from "@/components/ui/DataTable";
import PrintRfidModal from "@/modules/warehouse/components/PrintRfidModal";

const columns = [
  { name: "รหัสสินค้า", uid: "number", sortable: true },
  { name: "ชื่อสินค้า", uid: "displayName", sortable: true },
  { name: "โครงการ", uid: "projectName", sortable: true },
  { name: "ประเภท", uid: "type", sortable: true },
  { name: "คงเหลือ", uid: "inventory", sortable: true },
  { name: "หน่วย", uid: "baseUnitOfMeasure", sortable: true },
  { name: "ราคาต่อหน่วย", uid: "unitPrice", sortable: true },
  { name: "ต้นทุน", uid: "unitCost", sortable: true },
  { name: "หมวดหมู่", uid: "itemCategoryCode", sortable: true },
  { name: "", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "displayName",
  "projectName",
  "type",
  "inventory",
  "baseUnitOfMeasure",
  "unitPrice",
  "unitCost",
  "itemCategoryCode",
  "actions",
];

export default function WarehouseInventoryGroupView({ items, loading }) {
  const [printItem, setPrintItem] = useState(null);

  const summary = useMemo(() => {
    const totalQty = items.reduce((s, i) => s + (Number(i.inventory) || 0), 0);
    const totalValue = items.reduce(
      (s, i) => s + (Number(i.inventory) || 0) * (Number(i.unitCost) || 0),
      0,
    );
    return { totalItems: items.length, totalQty, totalValue };
  }, [items]);

  const renderCell = useCallback((item, columnKey) => {
    switch (columnKey) {
      case "displayName":
        return <span className="font-light">{item.displayName}</span>;
      case "projectName":
        return item.projectName ? (
          <Chip variant="flat" size="md" radius="md" color="secondary">
            {item.projectName}
          </Chip>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      case "inventory": {
        const inv = Number(item.inventory);
        return (
          <span className={inv > 0 ? "text-success" : "text-danger"}>
            {item.inventory != null ? inv.toLocaleString("th-TH") : "-"}
          </span>
        );
      }
      case "unitPrice":
        return item.unitPrice != null
          ? Number(item.unitPrice).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })
          : "-";
      case "unitCost": {
        const hasCost = item.unitCost != null && Number(item.unitCost) > 0;
        return (
          <span className={hasCost ? "text-primary" : "text-danger"}>
            {item.unitCost != null
              ? Number(item.unitCost).toLocaleString("th-TH", {
                  minimumFractionDigits: 2,
                })
              : "-"}
          </span>
        );
      }
      case "type":
        return (
          <Chip variant="flat" size="md" radius="md" color="default">
            {item.type || "-"}
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
            <Printer size={16} />
          </Button>
        );
      default:
        return item[columnKey] || "-";
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="gap-1">
            <p className="text-sm text-muted-foreground">รายการสินค้า</p>
            <p className="text-sm font-light">
              {summary.totalItems.toLocaleString("th-TH")}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="gap-1">
            <p className="text-sm text-muted-foreground">จำนวนคงเหลือ</p>
            <p className="text-sm font-light text-success">
              {summary.totalQty.toLocaleString("th-TH")}
            </p>
          </CardBody>
        </Card>
        <Card shadow="none" className="border border-border hover:border-primary transition-colors duration-200">
          <CardBody className="gap-1">
            <p className="text-sm text-muted-foreground">มูลค่า (ต้นทุน)</p>
            <p className="text-sm font-light text-primary">
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
        rowKey="number"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยรหัสหรือชื่อสินค้า..."
        searchKeys={["number", "displayName", "projectName"]}
        emptyContent="ไม่พบรายการสินค้า"
        actionMenuItems={(item) => [
          { key: "print", label: "พิมพ์", icon: <Printer size={16} />, onPress: () => setPrintItem(item) },
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
