"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import { Save } from "lucide-react";
import { get, post } from "@/lib/apiClient";
import { toast } from "sonner";

export default function StockItemsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prices, setPrices] = useState({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await get("/api/marketing/omnichannel/stock-items");
        setItems(data);
        // Initialize prices from customPrice
        const initial = {};
        for (const item of data) {
          if (item.customPrice != null) {
            initial[item.number] = item.customPrice;
          }
        }
        setPrices(initial);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updatePrice = (number, value) => {
    setPrices((prev) => ({ ...prev, [number]: value }));
  };

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

      await post("/api/marketing/omnichannel/stock-items", { items: toSave });
      toast.success(`บันทึกราคา ${toSave.length} รายการเรียบร้อย`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.number?.toLowerCase().includes(s) ||
      item.displayName?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Price List</h2>
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
      </div>

      <Input
        placeholder="ค้นหาด้วยรหัส, ชื่อสินค้า..."
        variant="bordered"
        radius="md"
        size="md"
        value={search}
        onValueChange={setSearch}
        className="max-w-md"
      />

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Spinner />
        </div>
      ) : (
        <Table aria-label="Price List" classNames={{ tr: "border-b border-default" }}>
          <TableHeader>
            <TableColumn>รหัสสินค้า</TableColumn>
            <TableColumn>ชื่อสินค้า</TableColumn>
            <TableColumn width={120} className="text-right">Stock</TableColumn>
            <TableColumn width={160} className="text-right">ราคา BC</TableColumn>
            <TableColumn width={180}>ราคาขาย</TableColumn>
          </TableHeader>
          <TableBody emptyContent="ไม่พบสินค้า">
            {filtered.map((item) => (
              <TableRow key={item.number}>
                <TableCell>{item.number}</TableCell>
                <TableCell>
                  <span className="font-medium">{item.displayName}</span>
                </TableCell>
                <TableCell>
                  <span
                    className={`block text-right ${
                      Number(item.inventory) > 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {item.inventory != null
                      ? Number(item.inventory).toLocaleString("th-TH")
                      : "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="block text-right text-default-400">
                    {item.unitPrice != null
                      ? Number(item.unitPrice).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })
                      : "-"}
                  </span>
                </TableCell>
                <TableCell>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
