import { useState, useCallback, useMemo } from "react";
import { Button, Input } from "@heroui/react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { saveStockItemPrices } from "@/modules/marketing/actions";
import DataTable from "@/components/ui/DataTable";

const FIXED_PACKET_COST = 25;
const FIXED_SHIPPING_COST = 200;

const COLUMNS = [
  { name: "รหัสสินค้า", uid: "bcItemNumber", sortable: true },
  { name: "ชื่อสินค้า", uid: "bcItemDisplayName", sortable: true },
  { name: "คงคลัง", uid: "bcItemInventory", sortable: true },
  { name: "ราคา BC", uid: "bcItemUnitPrice", sortable: true },
  { name: "ราคาขาย", uid: "customPrice", sortable: true },
  { name: "ต้นทุนสินค้า", uid: "bcItemUnitCost", sortable: true },
  { name: "ค่าแพ็ค", uid: "packetCost" },
  { name: "ค่าขนส่ง", uid: "shippingCost" },
  { name: "ต้นทุนรวม", uid: "totalCost", sortable: true },
  { name: "กำไร", uid: "profit", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = [
  "bcItemNumber",
  "bcItemDisplayName",
  "bcItemInventory",
  "bcItemUnitPrice",
  "customPrice",
  "bcItemUnitCost",
  "packetCost",
  "shippingCost",
  "totalCost",
  "profit",
];

export default function StockItemsView({ items, loading, prices, updatePrice }) {
  const [saving, setSaving] = useState(false);

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const toSave = Object.entries(prices)
        .filter(([, price]) => price !== "" && price != null)
        .map(([number, price]) => ({
          number,
          name: items.find((i) => i.bcItemNumber === number)?.bcItemDisplayName || "",
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
        const customPrice = prices[item.bcItemNumber] != null ? prices[item.bcItemNumber] : "";
        const cost = Number(item.bcItemUnitCost) || 0;
        const totalCost = cost + FIXED_PACKET_COST + FIXED_SHIPPING_COST;
        const sellingPrice = Number(customPrice) || Number(item.bcItemUnitPrice) || 0;
        const profit = sellingPrice > 0 ? sellingPrice - totalCost : null;
        return { ...item, customPrice, totalCost, profit };
      }),
    [items, prices]
  );

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "bcItemDisplayName":
          return <span className="font-light">{item.bcItemDisplayName}</span>;
        case "bcItemInventory":
          return (
            <span
              className={`block text-right ${
                Number(item.bcItemInventory) > 0 ? "text-success" : "text-danger"
              }`}
            >
              {item.bcItemInventory != null
                ? Number(item.bcItemInventory).toLocaleString("th-TH")
                : "-"}
            </span>
          );
        case "bcItemUnitPrice":
          return (
            <span className="block text-right text-muted-foreground">
              {item.bcItemUnitPrice != null
                ? Number(item.bcItemUnitPrice).toLocaleString("th-TH", {
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
              size="md"
              type="bcItemNumber"
              placeholder="0.00"
              classNames={{ input: "text-right" }}
              value={
                prices[item.bcItemNumber] != null
                  ? String(prices[item.bcItemNumber])
                  : ""
              }
              onValueChange={(v) => updatePrice(item.bcItemNumber, v)}
            />
          );
        case "bcItemUnitCost":
          return (
            <span className="block text-right text-muted-foreground">
              {item.bcItemUnitCost != null
                ? Number(item.bcItemUnitCost).toLocaleString("th-TH", {
                    minimumFractionDigits: 2,
                  })
                : "-"}
            </span>
          );
        case "packetCost":
          return (
            <span className="block text-right text-muted-foreground">
              {FIXED_PACKET_COST.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          );
        case "shippingCost":
          return (
            <span className="block text-right text-muted-foreground">
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
          if (item.profit == null) return <span className="block text-right text-muted-foreground">-</span>;
          const isPositive = item.profit >= 0;
          return (
            <span className={`block text-right font-light ${isPositive ? "text-success" : "text-danger"}`}>
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
      <p className="text-xs font-light">รายการราคา</p>

      <DataTable
        columns={COLUMNS}
        data={tableData}
        renderCell={renderCell}
        rowKey="bcItemNumber"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยรหัส, ชื่อสินค้า..."
        searchKeys={["bcItemNumber", "bcItemDisplayName"]}
        topEndContent={saveButton}
        defaultRowsPerPage={20}
        emptyContent="ไม่พบสินค้า"
        enableCardView
      />
    </div>
  );
}
