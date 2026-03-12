"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  useDisclosure,
} from "@heroui/react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import DataTable from "@/components/ui/DataTable";

const PROMO_TYPES = [
  { value: "discount_percent", label: "ลดราคา (%)" },
  { value: "discount_amount", label: "ลดราคา (บาท)" },
  { value: "buy_x_get_y", label: "ซื้อ X แถม Y" },
  { value: "free_shipping", label: "ส่งฟรี" },
  { value: "bundle", label: "ซื้อเป็นชุด" },
  { value: "freebie", label: "ของแถม" },
];

const COLUMNS = [
  { name: "ชื่อโปรโมชั่น", uid: "omPromotionName", sortable: true },
  { name: "ประเภท", uid: "omPromotionType", sortable: true },
  { name: "มูลค่า", uid: "omPromotionValue", sortable: true },
  { name: "สินค้า", uid: "omPromotionApplicableProducts" },
  { name: "วันเริ่ม", uid: "omPromotionStartDate", sortable: true },
  { name: "วันสิ้นสุด", uid: "omPromotionEndDate", sortable: true },
  { name: "สถานะ", uid: "omPromotionIsActive", sortable: true },
  { name: "", uid: "actions" },
];

const INITIAL_FORM = {
  omPromotionName: "",
  omPromotionDescription: "",
  omPromotionType: "discount_percent",
  omPromotionValue: "",
  omPromotionMinQuantity: "1",
  omPromotionApplicableProducts: [],
  omPromotionStartDate: "",
  omPromotionEndDate: "",
  omPromotionIsActive: true,
};

export default function PromotionsView({ promotions, loading, stockItems = [], onAdd, onUpdate, onDelete }) {
  const modal = useDisclosure();
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setProductSearch("");
    modal.onOpen();
  };

  const openEdit = (promo) => {
    setForm({
      omPromotionName: promo.omPromotionName || "",
      omPromotionDescription: promo.omPromotionDescription || "",
      omPromotionType: promo.omPromotionType || "discount_percent",
      omPromotionValue: String(promo.omPromotionValue || ""),
      omPromotionMinQuantity: String(promo.omPromotionMinQuantity || 1),
      omPromotionApplicableProducts: promo.omPromotionApplicableProducts || [],
      omPromotionStartDate: promo.omPromotionStartDate || "",
      omPromotionEndDate: promo.omPromotionEndDate || "",
      omPromotionIsActive: promo.omPromotionIsActive !== false,
    });
    setEditingId(promo.omPromotionId);
    setProductSearch("");
    modal.onOpen();
  };

  const handleSave = async () => {
    if (!form.omPromotionName.trim()) return;
    try {
      setSaving(true);
      const payload = {
        ...form,
        omPromotionValue: Number(form.omPromotionValue) || 0,
        omPromotionMinQuantity: Number(form.omPromotionMinQuantity) || 1,
        omPromotionStartDate: form.omPromotionStartDate || null,
        omPromotionEndDate: form.omPromotionEndDate || null,
      };
      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onAdd(payload);
      }
      modal.onClose();
    } catch (err) {
      // toast handled in hook
    } finally {
      setSaving(false);
    }
  };

  const addProduct = (itemNumber) => {
    if (form.omPromotionApplicableProducts.includes(itemNumber)) return;
    setForm((f) => ({
      ...f,
      omPromotionApplicableProducts: [...f.omPromotionApplicableProducts, itemNumber],
    }));
    setProductSearch("");
  };

  const removeProduct = (itemNumber) => {
    setForm((f) => ({
      ...f,
      omPromotionApplicableProducts: f.omPromotionApplicableProducts.filter((n) => n !== itemNumber),
    }));
  };

  const getItemName = (itemNumber) => {
    const item = stockItems.find((i) => i.bcItemNumber === itemNumber);
    return item?.bcItemDisplayName || itemNumber;
  };

  const filteredStockItems = stockItems.filter(
    (i) =>
      productSearch &&
      !form.omPromotionApplicableProducts.includes(i.bcItemNumber) &&
      (i.bcItemNumber?.toLowerCase().includes(productSearch.toLowerCase()) ||
        i.bcItemDisplayName?.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const getTypeLabel = (type) => PROMO_TYPES.find((t) => t.value === type)?.label || type;

  const renderCell = (item, key) => {
    switch (key) {
      case "omPromotionName":
        return (
          <div>
            <p className="font-light">{item.omPromotionName}</p>
            {item.omPromotionDescription && (
              <p className="text-xs text-default-400 line-clamp-1">{item.omPromotionDescription}</p>
            )}
          </div>
        );
      case "omPromotionType":
        return <Chip size="sm" variant="flat">{getTypeLabel(item.omPromotionType)}</Chip>;
      case "omPromotionValue":
        if (item.omPromotionType === "discount_percent") return `${item.omPromotionValue}%`;
        if (item.omPromotionType === "discount_amount") return `${Number(item.omPromotionValue).toLocaleString("th-TH")} บาท`;
        return item.omPromotionValue || "-";
      case "omPromotionApplicableProducts": {
        const products = item.omPromotionApplicableProducts || [];
        if (products.length === 0) return <span className="text-xs text-default-400">ทุกสินค้า</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {products.slice(0, 3).map((p) => (
              <Chip key={p} size="sm" variant="flat" color="primary">
                {p}
              </Chip>
            ))}
            {products.length > 3 && (
              <Chip size="sm" variant="flat">+{products.length - 3}</Chip>
            )}
          </div>
        );
      }
      case "omPromotionStartDate":
        return item.omPromotionStartDate || "-";
      case "omPromotionEndDate":
        return item.omPromotionEndDate || "-";
      case "omPromotionIsActive":
        return (
          <Chip size="sm" variant="flat" color={item.omPromotionIsActive ? "success" : "default"}>
            {item.omPromotionIsActive ? "ใช้งาน" : "ปิด"}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button isIconOnly size="sm" variant="light" onPress={() => openEdit(item)}>
              <Pencil size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onDelete(item.omPromotionId)}>
              <Trash2 size={16} />
            </Button>
          </div>
        );
      default:
        return item[key] || "-";
    }
  };

  const addButton = (
    <Button color="primary" size="md" radius="md" startContent={<Plus />} onPress={openCreate}>
      เพิ่มโปรโมชั่น
    </Button>
  );

  return (
    <div className="flex flex-col w-full h-full gap-4">
      <p className="text-xs font-light">โปรโมชั่น</p>

      <DataTable
        columns={COLUMNS}
        data={promotions}
        renderCell={renderCell}
        rowKey="omPromotionId"
        isLoading={loading}
        initialVisibleColumns={COLUMNS.map((c) => c.uid)}
        searchPlaceholder="ค้นหาโปรโมชั่น..."
        searchKeys={["omPromotionName", "omPromotionDescription"]}
        topEndContent={addButton}
        defaultRowsPerPage={20}
        emptyContent="ยังไม่มีโปรโมชั่น"
        enableCardView
      />

      <Modal isOpen={modal.isOpen} onOpenChange={modal.onClose} size="xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>{editingId ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่นใหม่"}</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                label="ชื่อโปรโมชั่น"
                labelPlacement="outside"
                placeholder="เช่น ซื้อ 2 ชิ้น ลด 10%"
                variant="bordered"
                size="md"
                radius="md"
                value={form.omPromotionName}
                onValueChange={(v) => setForm((f) => ({ ...f, omPromotionName: v }))}
                isRequired
              />
              <Textarea
                label="รายละเอียด"
                labelPlacement="outside"
                placeholder="อธิบายเงื่อนไขโปรโมชั่น..."
                variant="bordered"
                size="md"
                radius="md"
                minRows={2}
                value={form.omPromotionDescription}
                onValueChange={(v) => setForm((f) => ({ ...f, omPromotionDescription: v }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="ประเภท"
                  labelPlacement="outside"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={[form.omPromotionType]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0];
                    if (val) setForm((f) => ({ ...f, omPromotionType: val }));
                  }}
                >
                  {PROMO_TYPES.map((t) => (
                    <SelectItem key={t.value}>{t.label}</SelectItem>
                  ))}
                </Select>
                <Input
                  label="มูลค่า"
                  labelPlacement="outside"
                  placeholder="0"
                  variant="bordered"
                  size="md"
                  radius="md"
                  type="number"
                  value={form.omPromotionValue}
                  onValueChange={(v) => setForm((f) => ({ ...f, omPromotionValue: v }))}
                />
              </div>
              <Input
                label="จำนวนขั้นต่ำ"
                labelPlacement="outside"
                placeholder="1"
                variant="bordered"
                size="md"
                radius="md"
                type="number"
                value={form.omPromotionMinQuantity}
                onValueChange={(v) => setForm((f) => ({ ...f, omPromotionMinQuantity: v }))}
              />

              {/* Product selection */}
              <div>
                <p className="text-sm mb-2">สินค้าที่ใช้โปรโมชั่นนี้</p>
                {form.omPromotionApplicableProducts.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {form.omPromotionApplicableProducts.map((itemNumber) => (
                      <Chip
                        key={itemNumber}
                        size="sm"
                        variant="flat"
                        color="primary"
                        onClose={() => removeProduct(itemNumber)}
                      >
                        {getItemName(itemNumber)}
                      </Chip>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-default-400 mb-2">ยังไม่ได้เลือกสินค้า = ใช้กับทุกสินค้า</p>
                )}
                <Input
                  placeholder="พิมพ์ค้นหาสินค้าเพื่อเพิ่ม..."
                  variant="bordered"
                  size="sm"
                  radius="md"
                  value={productSearch}
                  onValueChange={setProductSearch}
                />
                {productSearch && (
                  <div className="max-h-40 overflow-y-auto border rounded-md mt-1">
                    {filteredStockItems.slice(0, 20).map((item) => (
                      <button
                        key={item.bcItemNumber}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-default-100 text-sm"
                        onClick={() => addProduct(item.bcItemNumber)}
                      >
                        <span className="font-medium">{item.bcItemNumber}</span>
                        <span className="text-default-400 ml-2">{item.bcItemDisplayName}</span>
                      </button>
                    ))}
                    {filteredStockItems.length === 0 && (
                      <p className="px-3 py-2 text-sm text-default-400">ไม่พบสินค้า</p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="วันเริ่มต้น"
                  labelPlacement="outside"
                  variant="bordered"
                  size="md"
                  radius="md"
                  type="date"
                  value={form.omPromotionStartDate}
                  onValueChange={(v) => setForm((f) => ({ ...f, omPromotionStartDate: v }))}
                />
                <Input
                  label="วันสิ้นสุด"
                  labelPlacement="outside"
                  variant="bordered"
                  size="md"
                  radius="md"
                  type="date"
                  value={form.omPromotionEndDate}
                  onValueChange={(v) => setForm((f) => ({ ...f, omPromotionEndDate: v }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  isSelected={form.omPromotionIsActive}
                  onValueChange={(v) => setForm((f) => ({ ...f, omPromotionIsActive: v }))}
                  size="sm"
                />
                <span className="text-sm">เปิดใช้งาน</span>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" size="md" radius="md" onPress={modal.onClose}>
              ยกเลิก
            </Button>
            <Button
              color="primary"
              size="md"
              radius="md"
              onPress={handleSave}
              isLoading={saving}
              isDisabled={!form.omPromotionName.trim()}
            >
              {editingId ? "บันทึก" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
