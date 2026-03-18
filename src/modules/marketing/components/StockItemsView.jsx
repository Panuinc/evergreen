import { useState, useCallback, useMemo } from "react";
import {
  Button,
  Input,
  Textarea,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Chip,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import { Save, FileEdit } from "lucide-react";
import { toast } from "sonner";
import { post } from "@/lib/apiClient";
import DataTable from "@/components/ui/DataTable";

const FIXED_PACKET_COST = 25;
const FIXED_SHIPPING_COST = 200;

const COLUMNS = [
  { name: "รหัสสินค้า", uid: "bcItemNo", sortable: true },
  { name: "ชื่อสินค้า", uid: "bcItemDescription", sortable: true },
  { name: "คงคลัง", uid: "bcItemInventory", sortable: true },
  { name: "ราคา BC", uid: "bcItemUnitPrice", sortable: true },
  { name: "ราคาขาย", uid: "customPrice", sortable: true },
  { name: "ราคาโปรฯ", uid: "promoPrice", sortable: true },
  { name: "ต้นทุนสินค้า", uid: "bcItemUnitCost", sortable: true },
  { name: "ค่าแพ็ค", uid: "packetCost" },
  { name: "ค่าขนส่ง", uid: "shippingCost" },
  { name: "ต้นทุนรวม", uid: "totalCost", sortable: true },
  { name: "กำไร", uid: "profit", sortable: true },
  { name: "ข้อมูล AI", uid: "productInfo" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "bcItemNo",
  "bcItemDescription",
  "bcItemInventory",
  "bcItemUnitPrice",
  "customPrice",
  "promoPrice",
  "bcItemUnitCost",
  "packetCost",
  "shippingCost",
  "totalCost",
  "profit",
  "productInfo",
];

function getPromoForItem(itemNumber, promotions) {
  if (!promotions || promotions.length === 0) return null;
  const today = new Date().toISOString().split("T")[0];

  for (const promo of promotions) {
    if (!promo.omPromotionIsActive) continue;
    if (promo.omPromotionStartDate && promo.omPromotionStartDate > today) continue;
    if (promo.omPromotionEndDate && promo.omPromotionEndDate < today) continue;

    const applicable = promo.omPromotionApplicableProducts || [];
    if (applicable.length > 0 && !applicable.includes(itemNumber)) continue;

    return promo;
  }
  return null;
}

function calcPromoPrice(sellingPrice, promo) {
  if (!promo || !sellingPrice) return null;
  if (promo.omPromotionType === "discount_percent") {
    const discount = Number(promo.omPromotionValue) || 0;
    return sellingPrice * (1 - discount / 100);
  }
  if (promo.omPromotionType === "discount_amount") {
    const discount = Number(promo.omPromotionValue) || 0;
    return Math.max(0, sellingPrice - discount);
  }
  return null;
}

export default function StockItemsView({ items, loading, prices, updatePrice, productInfoMap, updateProductInfo, saveAllProductInfo, promotions = [] }) {
  const [saving, setSaving] = useState(false);
  const modal = useDisclosure();
  const [editingItem, setEditingItem] = useState(null);

  const openProductInfo = useCallback((item) => {
    setEditingItem(item);
    modal.onOpen();
  }, [modal]);

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      const toSave = Object.entries(prices)
        .filter(([, price]) => price !== "" && price != null)
        .map(([number, price]) => ({
          number,
          name: items.find((i) => i.bcItemNo === number)?.bcItemDescription || "",
          price: Number(price) || 0,
        }));

      if (toSave.length === 0 && !saveAllProductInfo) {
        toast.info("ไม่มีราคาที่ต้องบันทึก");
        return;
      }

      const promises = [];
      if (toSave.length > 0) promises.push(post("/api/marketing/omnichannel/stockItems", { items: toSave }));
      if (saveAllProductInfo) promises.push(saveAllProductInfo());
      await Promise.all(promises);

      toast.success("บันทึกข้อมูลเรียบร้อย");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tableData = useMemo(
    () =>
      items.map((item) => {
        const customPrice = prices[item.bcItemNo] != null ? prices[item.bcItemNo] : "";
        const cost = Number(item.bcItemUnitCost) || 0;
        const totalCost = cost + FIXED_PACKET_COST + FIXED_SHIPPING_COST;
        const sellingPrice = Number(customPrice) || Number(item.bcItemUnitPrice) || 0;
        const promo = getPromoForItem(item.bcItemNo, promotions);
        const promoPrice = calcPromoPrice(sellingPrice, promo);
        const effectivePrice = promoPrice != null ? promoPrice : sellingPrice;
        const profit = effectivePrice > 0 ? effectivePrice - totalCost : null;
        return { ...item, customPrice, totalCost, profit, promoPrice, promoName: promo?.omPromotionName || null };
      }),
    [items, prices, promotions]
  );

  const renderCell = useCallback(
    (item, columnKey) => {
      switch (columnKey) {
        case "bcItemDescription":
          return <span className="font-light">{item.bcItemDescription}</span>;
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
              type="number"
              placeholder="0.00"
              classNames={{ input: "text-right" }}
              value={
                prices[item.bcItemNo] != null
                  ? String(prices[item.bcItemNo])
                  : ""
              }
              onValueChange={(v) => updatePrice(item.bcItemNo, v)}
            />
          );
        case "promoPrice":
          if (item.promoPrice == null) return <span className="block text-right text-muted-foreground">-</span>;
          return (
            <Tooltip content={item.promoName} placement="top">
              <span className="block text-right text-warning font-medium cursor-help">
                {Number(item.promoPrice).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
              </span>
            </Tooltip>
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
        case "productInfo": {
          const info = productInfoMap?.[item.bcItemNo];
          const hasInfo = info && (info.category || info.highlights || info.description);
          return (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color={hasInfo ? "primary" : "default"}
              onPress={() => openProductInfo(item)}
            >
              <FileEdit size={16} />
            </Button>
          );
        }
        default:
          return item[columnKey] || "-";
      }
    },
    [prices, updatePrice, productInfoMap, openProductInfo]
  );

  const saveButton = (
    <Button
      color="primary"
      size="md"
      radius="md"
      startContent={<Save />}
      onPress={handleSaveAll}
      isLoading={saving}
    >
      บันทึกทั้งหมด
    </Button>
  );

  const editingInfo = editingItem ? productInfoMap?.[editingItem.bcItemNo] || {} : {};

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <p className="text-xs font-light">รายการราคา</p>

      <DataTable
        columns={COLUMNS}
        data={tableData}
        renderCell={renderCell}
        rowKey="bcItemNo"
        isLoading={loading}
        initialVisibleColumns={INITIAL_VISIBLE_COLUMNS}
        searchPlaceholder="ค้นหาด้วยรหัส, ชื่อสินค้า..."
        searchKeys={["bcItemNo", "bcItemDescription"]}
        topEndContent={saveButton}
        defaultRowsPerPage={20}
        emptyContent="ไม่พบสินค้า"
        enableCardView
      />

      <Modal isOpen={modal.isOpen} onOpenChange={modal.onClose} size="xl" scrollBehavior="inside">
        <ModalContent>
          {editingItem && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <span>ข้อมูลสินค้าสำหรับ AI</span>
                <Chip size="sm" variant="flat">{editingItem.bcItemNo} — {editingItem.bcItemDescription}</Chip>
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <Input
                    label="หมวดหมู่"
                    labelPlacement="outside"
                    placeholder="เช่น ม่านม้วน, ม่านจีบ, รั้ว..."
                    variant="bordered"
                    size="md"
                    radius="md"
                    value={editingInfo.category || ""}
                    onValueChange={(v) => updateProductInfo(editingItem.bcItemNo, "category", v)}
                  />
                  <Textarea
                    label="จุดเด่น"
                    labelPlacement="outside"
                    placeholder="เช่น วัสดุพรีเมียม กันน้ำ กันUV ทนทาน..."
                    variant="bordered"
                    size="md"
                    radius="md"
                    minRows={2}
                    value={editingInfo.highlights || ""}
                    onValueChange={(v) => updateProductInfo(editingItem.bcItemNo, "highlights", v)}
                  />
                  <Textarea
                    label="รายละเอียดสินค้า"
                    labelPlacement="outside"
                    placeholder="คำอธิบายสินค้าที่ AI จะใช้ตอบลูกค้า..."
                    variant="bordered"
                    size="md"
                    radius="md"
                    minRows={3}
                    value={editingInfo.description || ""}
                    onValueChange={(v) => updateProductInfo(editingItem.bcItemNo, "description", v)}
                  />
                  <div className="bg-default-50 rounded-lg p-3 text-xs text-default-500">
                    ข้อมูลที่กรอกจะถูกส่งให้ AI ใช้ตอบคำถามลูกค้า กดปุ่ม &quot;บันทึกทั้งหมด&quot; ที่หน้าตารางเพื่อบันทึก
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" size="md" radius="md" onPress={modal.onClose}>
                  ปิด
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
