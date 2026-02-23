"use client";

import { useState, useCallback, useMemo } from "react";
import { Button, Input } from "@heroui/react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useStockItems } from "@/hooks/useStockItems";
import { saveStockItemPrices } from "@/actions/omnichannel";
import DataTable from "@/components/ui/DataTable";

const FIXED_PACKET_COST = 25;
const FIXED_SHIPPING_COST = 200;

const columns = [
  { name: "รหัสสินค้า", uid: "number", sortable: true },
  { name: "ชื่อสินค้า", uid: "displayName", sortable: true },
  { name: "คงคลัง", uid: "inventory", sortable: true },
  { name: "ราคา BC", uid: "unitPrice", sortable: true },
  { name: "ราคาขาย", uid: "customPrice", sortable: true },
  { name: "ต้นทุนสินค้า", uid: "unitCost", sortable: true },
  { name: "ค่าแพ็ค", uid: "packetCost" },
  { name: "ค่าขนส่ง", uid: "shippingCost" },
  { name: "ต้นทุนรวม", uid: "totalCost", sortable: true },
  { name: "กำไร", uid: "profit", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "displayName",
  "inventory",
  "unitPrice",
  "customPrice",
  "unitCost",
  "packetCost",
  "shippingCost",
  "totalCost",
  "profit",
];

export default function StockItemsPage() {
  const { items, loading, prices, updatePrice } = useStockItems();
  const [saving, setSaving] = useState(false);

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const toSave = Object.entries(prices)
        .filter(([, price]) => price !== "" && price != null)
        .map(([number, price]) => ({
          number,
          name: items.find((i) => i.number === number)?.displayName || "",
          price: Number(price) || 0,
        }));

      if (toSave.length === 0) {
        toast.info("ไม่มีราคาที่ต้องบันทึก");
        return;
      }

      await saveStockItemPrices(toSave);
      toast.success(`บันทึกราคา ${toSave.length} รายการเรียบร้อย`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tableData = useMemo(
    () =>
      items.map((item) => {
        const customPrice = prices[item.number] != null ? prices[item.number] : "";
        const cost = Number(item.unitCost) || 0;
        const totalCost = cost + FIXED_PACKET_COST + FIXED_SHIPPING_COST;
        const sellingPrice = Number(customPrice) || Number(item.unitPrice) || 0;
        const profit = sellingPrice > 0 ? sellingPrice - totalCost : null;
        return { ...item, customPrice, totalCost, profit };
      }),
    [items, prices]
  );

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "displayName":
          return <span className="font-medium">{item.displayName}</span>;
        case "inventory":
          return (
            <span
              className={`block text-right ${
                Number(item.inventory) > 0 ? "text-success" : "text-danger"
              }`}
            >
              {item.inventory != null
                ? Number(item.inventory).toLocaleString("th-TH")
                : "-"}
            </span>
          );
        case "unitPrice":
          return (
            <span className="block text-right text-default-400">
              {item.unitPrice != null
                ? Number(item.unitPrice).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })
                : "-"}
            </span>
          );
        case "customPrice":
          return (
            <Input
              variant="bordered"
              radius="md"
              size="sm"
              type="number"
              placeholder="0.00"
              classNames={{ input: "text-right" }}
              value={
                prices[item.number] != null
                  ? String(prices[item.number])
                  : ""
              }
              onValueChange={(v) => updatePrice(item.number, v)}
            />
          );
        case "unitCost":
          return (
            <span className="block text-right text-default-400">
              {item.unitCost != null
                ? Number(item.unitCost).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })
                : "-"}
            </span>
          );
        case "packetCost":
          return (
            <span className="block text-right text-default-400">
              {FIXED_PACKET_COST.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          );
        case "shippingCost":
          return (
            <span className="block text-right text-default-400">
              {FIXED_SHIPPING_COST.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          );
        case "totalCost":
          return (
            <span className="block text-right">
              {item.totalCost != null
                ? Number(item.totalCost).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })
                : "-"}
            </span>
          );
        case "profit": {
          if (item.profit == null) return <span className="block text-right text-default-300">-</span>;
          const isPositive = item.profit >= 0;
          return (
            <span className={`block text-right font-medium ${isPositive ? "text-success" : "text-danger"}`}>
              {Number(item.profit).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          );
        }
        default:
          return item[columnKey] || "-";
      }
    },
    [prices, updatePrice]
  );

  const saveButton = (
    <Button
      color="primary"
      size="md"
      radius="md"
      startContent={<Save size={14} />}
      onPress={handleSaveAll}
      isLoading={saving}
    >
      บันทึกทั้งหมด
    </Button>
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <h2 className="text-lg font-semibold">รายการราคา</h2>

      <DataTable
        columns={columns}
        data={tableData}
        renderCell={renderCell}
        rowKey="number"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยรหัส, ชื่อสินค้า..."
        searchKeys={["number", "displayName"]}
        topEndContent={saveButton}
        defaultRowsPerPage={20}
        emptyContent="ไม่พบสินค้า"
      />
    </div>
  );
}
