"use client";

import { useState, useCallback, useMemo } from "react";
import { Button, Input } from "@heroui/react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { useStockItems } from "@/hooks/useStockItems";
import { saveStockItemPrices } from "@/actions/omnichannel";
import DataTable from "@/components/ui/DataTable";

const columns = [
  { name: "รหัสสินค้า", uid: "number", sortable: true },
  { name: "ชื่อสินค้า", uid: "displayName", sortable: true },
  { name: "Stock", uid: "inventory", sortable: true },
  { name: "ราคา BC", uid: "unitPrice", sortable: true },
  { name: "ราคาขาย", uid: "customPrice", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "number",
  "displayName",
  "inventory",
  "unitPrice",
  "customPrice",
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
      items.map((item) => ({
        ...item,
        customPrice: prices[item.number] != null ? prices[item.number] : "",
      })),
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
      <h2 className="text-lg font-semibold">Price List</h2>

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
