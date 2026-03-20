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
import DataTable from "@/components/ui/dataTable";

const promoTypes = [
  { value: "discount_percent", label: "ลดราคา (%)" },
  { value: "discount_amount", label: "ลดราคา (บาท)" },
  { value: "buy_x_get_y", label: "ซื้อ X แถม Y" },
  { value: "free_shipping", label: "ส่งฟรี" },
  { value: "bundle", label: "ซื้อเป็นชุด" },
  { value: "freebie", label: "ของแถม" },
];

const columns = [
  { name: "ชื่อโปรโมชั่น", uid: "mktPromotionName", sortable: true },
  { name: "ประเภท", uid: "mktPromotionType", sortable: true },
  { name: "มูลค่า", uid: "mktPromotionValue", sortable: true },
  { name: "สินค้า", uid: "mktPromotionApplicableProducts" },
  { name: "วันเริ่ม", uid: "mktPromotionStartDate", sortable: true },
  { name: "วันสิ้นสุด", uid: "mktPromotionEndDate", sortable: true },
  { name: "สถานะ", uid: "mktPromotionIsActive", sortable: true },
  { name: "", uid: "actions" },
];

const initialForm = {
  mktPromotionName: "",
  mktPromotionDescription: "",
  mktPromotionType: "discount_percent",
  mktPromotionValue: "",
  mktPromotionMinQuantity: "1",
  mktPromotionApplicableProducts: [],
  mktPromotionStartDate: "",
  mktPromotionEndDate: "",
  mktPromotionIsActive: true,
};

export default function PromotionsView({ promotions, loading, stockItems = [], onAdd, onUpdate, onDelete }) {
  const modal = useDisclosure();
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const openCreate = () => {
    setForm(initialForm);
    setEditingId(null);
    setProductSearch("");
    modal.onOpen();
  };

  const openEdit = (promo) => {
    setForm({
      mktPromotionName: promo.mktPromotionName || "",
      mktPromotionDescription: promo.mktPromotionDescription || "",
      mktPromotionType: promo.mktPromotionType || "discount_percent",
      mktPromotionValue: String(promo.mktPromotionValue || ""),
      mktPromotionMinQuantity: String(promo.mktPromotionMinQuantity || 1),
      mktPromotionApplicableProducts: promo.mktPromotionApplicableProducts || [],
      mktPromotionStartDate: promo.mktPromotionStartDate || "",
      mktPromotionEndDate: promo.mktPromotionEndDate || "",
      mktPromotionIsActive: promo.mktPromotionIsActive !== false,
    });
    setEditingId(promo.mktPromotionId);
    setProductSearch("");
    modal.onOpen();
  };

  const handleSave = async () => {
    if (!form.mktPromotionName.trim()) return;
    try {
      setSaving(true);
      const payload = {
        ...form,
        mktPromotionValue: Number(form.mktPromotionValue) || 0,
        mktPromotionMinQuantity: Number(form.mktPromotionMinQuantity) || 1,
        mktPromotionStartDate: form.mktPromotionStartDate || null,
        mktPromotionEndDate: form.mktPromotionEndDate || null,
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
    if (form.mktPromotionApplicableProducts.includes(itemNumber)) return;
    setForm((f) => ({
      ...f,
      mktPromotionApplicableProducts: [...f.mktPromotionApplicableProducts, itemNumber],
    }));
    setProductSearch("");
  };

  const removeProduct = (itemNumber) => {
    setForm((f) => ({
      ...f,
      mktPromotionApplicableProducts: f.mktPromotionApplicableProducts.filter((n) => n !== itemNumber),
    }));
  };

  const getItemName = (itemNumber) => {
    const item = stockItems.find((i) => i.bcItemNo === itemNumber);
    return item?.bcItemDescription || itemNumber;
  };

  const filteredStockItems = stockItems.filter(
    (i) =>
      productSearch &&
      !form.mktPromotionApplicableProducts.includes(i.bcItemNo) &&
      (i.bcItemNo?.toLowerCase().includes(productSearch.toLowerCase()) ||
        i.bcItemDescription?.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const getTypeLabel = (type) => promoTypes.find((t) => t.value === type)?.label || type;

  const renderCell = (item, key) => {
    switch (key) {
      case "mktPromotionName":
        return (
          <div>
            <p className="font-light">{item.mktPromotionName}</p>
            {item.mktPromotionDescription && (
              <p className="text-xs text-default-400 line-clamp-1">{item.mktPromotionDescription}</p>
            )}
          </div>
        );
      case "mktPromotionType":
        return <Chip size="sm" variant="flat">{getTypeLabel(item.mktPromotionType)}</Chip>;
      case "mktPromotionValue":
        if (item.mktPromotionType === "discount_percent") return `${item.mktPromotionValue}%`;
        if (item.mktPromotionType === "discount_amount") return `${Number(item.mktPromotionValue).toLocaleString("th-TH")} บาท`;
        return item.mktPromotionValue || "-";
      case "mktPromotionApplicableProducts": {
        const products = item.mktPromotionApplicableProducts || [];
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
      case "mktPromotionStartDate":
        return item.mktPromotionStartDate || "-";
      case "mktPromotionEndDate":
        return item.mktPromotionEndDate || "-";
      case "mktPromotionIsActive":
        return (
          <Chip size="sm" variant="flat" color={item.mktPromotionIsActive ? "success" : "default"}>
            {item.mktPromotionIsActive ? "ใช้งาน" : "ปิด"}
          </Chip>
        );
      case "actions":
        return (
          <div className="flex gap-1">
            <Button isIconOnly size="sm" variant="light" onPress={() => openEdit(item)}>
              <Pencil size={16} />
            </Button>
            <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onDelete(item.mktPromotionId)}>
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
        columns={columns}
        data={promotions}
        renderCell={renderCell}
        rowKey="mktPromotionId"
        isLoading={loading}
        initialVisibleColumns={columns.map((c) => c.uid)}
        searchPlaceholder="ค้นหาโปรโมชั่น..."
        searchKeys={["mktPromotionName", "mktPromotionDescription"]}
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
                value={form.mktPromotionName}
                onValueChange={(v) => setForm((f) => ({ ...f, mktPromotionName: v }))}
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
                value={form.mktPromotionDescription}
                onValueChange={(v) => setForm((f) => ({ ...f, mktPromotionDescription: v }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="ประเภท"
                  labelPlacement="outside"
                  variant="bordered"
                  size="md"
                  radius="md"
                  selectedKeys={[form.mktPromotionType]}
                  onSelectionChange={(keys) => {
                    const val = Array.from(keys)[0];
                    if (val) setForm((f) => ({ ...f, mktPromotionType: val }));
                  }}
                >
                  {promoTypes.map((t) => (
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
                  value={form.mktPromotionValue}
                  onValueChange={(v) => setForm((f) => ({ ...f, mktPromotionValue: v }))}
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
                value={form.mktPromotionMinQuantity}
                onValueChange={(v) => setForm((f) => ({ ...f, mktPromotionMinQuantity: v }))}
              />

              {/* Product selection */}
              <div>
                <p className="text-sm mb-2">สินค้าที่ใช้โปรโมชั่นนี้</p>
                {form.mktPromotionApplicableProducts.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {form.mktPromotionApplicableProducts.map((itemNumber) => (
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
                        key={item.bcItemNo}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-default-100 text-sm"
                        onClick={() => addProduct(item.bcItemNo)}
                      >
                        <span className="font-medium">{item.bcItemNo}</span>
                        <span className="text-default-400 ml-2">{item.bcItemDescription}</span>
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
                  value={form.mktPromotionStartDate}
                  onValueChange={(v) => setForm((f) => ({ ...f, mktPromotionStartDate: v }))}
                />
                <Input
                  label="วันสิ้นสุด"
                  labelPlacement="outside"
                  variant="bordered"
                  size="md"
                  radius="md"
                  type="date"
                  value={form.mktPromotionEndDate}
                  onValueChange={(v) => setForm((f) => ({ ...f, mktPromotionEndDate: v }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  isSelected={form.mktPromotionIsActive}
                  onValueChange={(v) => setForm((f) => ({ ...f, mktPromotionIsActive: v }))}
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
              isDisabled={!form.mktPromotionName.trim()}
            >
              {editingId ? "บันทึก" : "สร้าง"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
